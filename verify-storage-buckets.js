import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Expected buckets from migration files
const expectedBuckets = [
  // From 011_create_storage_buckets.sql
  'hero-images',
  'testimonial-photos', 
  'program-icons',
  'student-photos',
  'document-uploads',
  'news-images',
  'gallery-images',
  'staff-photos',
  // From 017_enhanced_academic_programs_schema.sql
  'program-images',
  'program-thumbnails',
  // From 998_create_missing_photo_buckets.sql
  'news-photos',
  'event-photos',
  // Existing bucket
  'cv-uploads'
];

async function verifyStorageBuckets() {
  console.log('🔍 Verifying Storage Buckets Configuration\n');
  console.log('=' .repeat(70));

  try {
    // 1. Check buckets via Storage API
    console.log('\n📦 Checking buckets via Storage API:');
    const { data: apiBuckets, error: apiError } = await supabase.storage.listBuckets();
    
    if (apiError) {
      console.error('❌ Error fetching buckets via API:', apiError.message);
    } else {
      console.log(`   Found: ${apiBuckets?.length || 0} buckets`);
      apiBuckets?.forEach(bucket => {
        console.log(`   ✅ ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
    }

    // 2. Query storage.buckets table directly
    console.log('\n🗄️  Querying storage.buckets table directly:');
    const { data: dbBuckets, error: dbError } = await supabase
      .schema('storage')
      .from('buckets')
      .select('*');
    
    if (dbError) {
      console.error('❌ Error querying storage.buckets:', dbError.message);
      
      // Try alternative query method
      console.log('\n🔄 Trying alternative query method...');
      const { data: altBuckets, error: altError } = await supabase.rpc('get_storage_buckets');
      
      if (altError) {
        console.log('⚠️  Alternative query also failed. Buckets may not be accessible via API.');
      } else {
        console.log('✅ Alternative query successful:');
        console.log(altBuckets);
      }
    } else {
      console.log(`   Found: ${dbBuckets?.length || 0} buckets in database`);
      dbBuckets?.forEach(bucket => {
        console.log(`   📁 ${bucket.name || bucket.id} - Public: ${bucket.public}, Size Limit: ${bucket.file_size_limit}`);
      });
    }

    // 3. Compare with expected buckets
    console.log('\n📊 Bucket Analysis:');
    const actualBuckets = apiBuckets?.map(b => b.name) || [];
    const missingBuckets = expectedBuckets.filter(bucket => !actualBuckets.includes(bucket));
    const extraBuckets = actualBuckets.filter(bucket => !expectedBuckets.includes(bucket));
    
    console.log(`   Expected buckets: ${expectedBuckets.length}`);
    console.log(`   Actual buckets: ${actualBuckets.length}`);
    console.log(`   Missing buckets: ${missingBuckets.length}`);
    console.log(`   Extra buckets: ${extraBuckets.length}`);

    if (missingBuckets.length > 0) {
      console.log('\n❌ Missing Buckets:');
      missingBuckets.forEach(bucket => console.log(`   - ${bucket}`));
    }

    if (extraBuckets.length > 0) {
      console.log('\n➕ Extra Buckets:');
      extraBuckets.forEach(bucket => console.log(`   - ${bucket}`));
    }

    // 4. Check storage policies
    console.log('\n🔐 Checking Storage Policies:');
    try {
      const { data: policies, error: policyError } = await supabase
        .from('policies')
        .select('*')
        .eq('table_name', 'objects')
        .eq('schema_name', 'storage');
      
      if (policyError) {
        console.log('⚠️  Could not fetch storage policies:', policyError.message);
      } else {
        console.log(`   Found: ${policies?.length || 0} storage policies`);
        
        // Group policies by bucket
        const bucketPolicies = {};
        policies?.forEach(policy => {
          const bucketMatch = policy.definition?.match(/bucket_id = '([^']+)'/);
          if (bucketMatch) {
            const bucketName = bucketMatch[1];
            if (!bucketPolicies[bucketName]) bucketPolicies[bucketName] = [];
            bucketPolicies[bucketName].push(policy.name);
          }
        });
        
        Object.entries(bucketPolicies).forEach(([bucket, policyNames]) => {
          console.log(`   📁 ${bucket}: ${policyNames.length} policies`);
          policyNames.forEach(name => console.log(`      - ${name}`));
        });
      }
    } catch (policyError) {
      console.log('⚠️  Error checking policies:', policyError.message);
    }

    // 5. Test bucket access
    console.log('\n🧪 Testing Bucket Access:');
    for (const bucket of actualBuckets.slice(0, 3)) { // Test first 3 buckets
      try {
        const { data: files, error: listError } = await supabase.storage
          .from(bucket)
          .list('', { limit: 1 });
        
        if (listError) {
          console.log(`   ❌ ${bucket}: Access denied - ${listError.message}`);
        } else {
          console.log(`   ✅ ${bucket}: Accessible (${files?.length || 0} files)`);
        }
      } catch (accessError) {
        console.log(`   ⚠️  ${bucket}: Test failed - ${accessError.message}`);
      }
    }

    // 6. Summary and recommendations
    console.log('\n📋 Summary:');
    if (actualBuckets.length === expectedBuckets.length && missingBuckets.length === 0) {
      console.log('   ✅ All expected storage buckets are present!');
      console.log('   ✅ Storage configuration appears to be complete.');
    } else {
      console.log(`   ⚠️  Storage configuration incomplete:`);
      console.log(`      - Expected: ${expectedBuckets.length} buckets`);
      console.log(`      - Found: ${actualBuckets.length} buckets`);
      console.log(`      - Missing: ${missingBuckets.length} buckets`);
      
      if (missingBuckets.length > 0) {
        console.log('\n💡 Recommendations:');
        console.log('   1. Verify that all migration files were applied successfully');
        console.log('   2. Check Supabase Dashboard > Storage to see if buckets exist there');
        console.log('   3. Required migration files:');
        console.log('      - 011_create_storage_buckets.sql (8 buckets)');
        console.log('      - 017_enhanced_academic_programs_schema.sql (2 buckets)');
        console.log('      - 998_create_missing_photo_buckets.sql (2 buckets)');
        console.log('   4. If buckets are missing, re-run the migrations in Supabase SQL Editor');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error during verification:', error.message);
    console.error('Stack trace:', error.stack);
  }

  console.log('\n' + '=' .repeat(70));
  console.log('🏁 Storage bucket verification completed');
}

// Run the verification
verifyStorageBuckets().catch(console.error);