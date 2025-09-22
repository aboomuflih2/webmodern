import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStorageBuckets() {
  console.log('🔍 Checking Storage Buckets in Supabase Database\n');
  console.log('=' .repeat(60));

  try {
    // 1. List all buckets using Supabase Storage API
    console.log('\n📦 Listing buckets via Storage API:');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
    } else {
      console.log(`✅ Found ${buckets.length} buckets via API:`);
      buckets.forEach((bucket, index) => {
        console.log(`   ${index + 1}. ${bucket.name} (ID: ${bucket.id})`);
        console.log(`      - Public: ${bucket.public}`);
        console.log(`      - Created: ${bucket.created_at}`);
        console.log(`      - Updated: ${bucket.updated_at}`);
      });
    }

    // 2. Try to query storage schema tables
    console.log('\n🗄️  Checking storage schema:');
    try {
      const { data: storageBuckets, error: storageError } = await supabase
        .schema('storage')
        .from('buckets')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (storageError) {
        console.error('❌ Error querying storage.buckets:', storageError.message);
      } else {
        console.log(`✅ Found ${storageBuckets.length} buckets in storage schema:`);
        storageBuckets.forEach((bucket, index) => {
          console.log(`   ${index + 1}. ${bucket.name} (ID: ${bucket.id})`);
          console.log(`      - Public: ${bucket.public}`);
          console.log(`      - File size limit: ${bucket.file_size_limit || 'No limit'}`);
          console.log(`      - Allowed MIME types: ${bucket.allowed_mime_types || 'All types'}`);
          console.log(`      - Created: ${bucket.created_at}`);
        });
      }
    } catch (schemaError) {
      console.error('❌ Error accessing storage schema:', schemaError.message);
    }

    // 3. Check bucket usage/file counts
    console.log('\n📊 Checking bucket usage:');
    if (buckets && buckets.length > 0) {
      for (const bucket of buckets) {
        try {
          const { data: files, error: filesError } = await supabase.storage
            .from(bucket.name)
            .list('', { limit: 1 });
          
          if (filesError) {
            console.log(`   ${bucket.name}: ❌ Error accessing (${filesError.message})`);
          } else {
            console.log(`   ${bucket.name}: ✅ Accessible (${files.length > 0 ? 'has files' : 'empty'})`);
          }
        } catch (error) {
          console.log(`   ${bucket.name}: ❌ Error checking (${error.message})`);
        }
      }
    }

    // 4. Expected buckets from migration files
    console.log('\n📋 Expected buckets from migration files:');
    const expectedBuckets = [
      'hero-images',
      'testimonial-photos', 
      'program-icons',
      'cv-uploads',
      'document-uploads',
      'news-images',
      'gallery-images',
      'staff-photos',
      'news-photos',
      'event-photos',
      'program-images',
      'program-thumbnails',
      'student-photos'
    ];

    const existingBucketNames = buckets ? buckets.map(b => b.name) : [];
    const missingBuckets = expectedBuckets.filter(name => !existingBucketNames.includes(name));
    const extraBuckets = existingBucketNames.filter(name => !expectedBuckets.includes(name));

    console.log(`\n📈 Bucket Analysis:`);
    console.log(`   Expected: ${expectedBuckets.length}`);
    console.log(`   Found: ${existingBucketNames.length}`);
    
    if (missingBuckets.length > 0) {
      console.log(`\n❌ Missing buckets (${missingBuckets.length}):`);
      missingBuckets.forEach(bucket => console.log(`   - ${bucket}`));
      
      console.log('\n🔧 To create missing buckets, you need to apply these migrations:');
      console.log('   - supabase/migrations/011_create_storage_buckets.sql');
      console.log('   - supabase/migrations/020_setup_storage_policies.sql');
      console.log('   - Other bucket-specific migration files');
    }
    
    if (extraBuckets.length > 0) {
      console.log(`\n➕ Extra buckets (${extraBuckets.length}):`);
      extraBuckets.forEach(bucket => console.log(`   - ${bucket}`));
    }

    if (missingBuckets.length === 0 && extraBuckets.length === 0) {
      console.log(`\n✅ All expected buckets are present!`);
    }

    // 5. Check which migration files exist
    console.log('\n📁 Checking migration files:');
    const fs = await import('fs');
    const path = await import('path');
    
    const migrationDir = 'supabase/migrations';
    try {
      const files = fs.default.readdirSync(migrationDir);
      const bucketMigrations = files.filter(file => 
        file.includes('bucket') || 
        file.includes('storage') || 
        file.includes('011_create_storage_buckets') ||
        file.includes('020_setup_storage_policies')
      );
      
      console.log(`   Found ${bucketMigrations.length} storage-related migration files:`);
      bucketMigrations.forEach(file => console.log(`   - ${file}`));
    } catch (error) {
      console.log('   ❌ Could not read migration directory:', error.message);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('Stack trace:', error.stack);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Storage bucket check completed');
}

// Run the check
checkStorageBuckets().catch(console.error);