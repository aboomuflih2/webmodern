const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createStorageBuckets() {
  console.log('📦 Creating all required storage buckets...\n');
  
  const requiredBuckets = [
    { name: 'hero-images', public: true, description: 'Hero section images' },
    { name: 'testimonial-photos', public: true, description: 'Testimonial photos' },
    { name: 'program-icons', public: true, description: 'Academic program icons' },
    { name: 'student-photos', public: true, description: 'Student photos' },
    { name: 'document-uploads', public: false, description: 'Private document uploads' },
    { name: 'news-images', public: true, description: 'News article images' },
    { name: 'gallery-images', public: true, description: 'Photo gallery images' },
    { name: 'staff-photos', public: true, description: 'Staff member photos' },
    { name: 'cv-uploads', public: false, description: 'CV/Resume uploads' },
    { name: 'gate-pass-documents', public: false, description: 'Gate pass ID proof documents' },
    { name: 'program-images', public: true, description: 'Program feature images' },
    { name: 'program-thumbnails', public: true, description: 'Program thumbnail images' },
    { name: 'news-photos', public: true, description: 'News photos' },
    { name: 'event-photos', public: true, description: 'Event photos' }
  ];
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const bucket of requiredBuckets) {
    try {
      console.log(`Creating bucket: ${bucket.name} (${bucket.public ? 'public' : 'private'})...`);
      
      const { data, error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        allowedMimeTypes: ['image/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`✅ ${bucket.name}: Already exists`);
          successCount++;
        } else {
          console.log(`❌ ${bucket.name}: ${error.message}`);
          errorCount++;
        }
      } else {
        console.log(`✅ ${bucket.name}: Created successfully`);
        successCount++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (err) {
      console.log(`❌ ${bucket.name}: Exception - ${err.message}`);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Storage Bucket Creation Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(`   📝 Total: ${requiredBuckets.length}`);
  
  // Verify buckets exist
  console.log('\n🔍 Verifying created buckets...');
  
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.log('❌ Error listing buckets:', listError.message);
    } else {
      console.log(`✅ Found ${buckets.length} total buckets:`);
      buckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
      
      // Check if gate-pass-documents bucket exists specifically
      const gatePassBucket = buckets.find(b => b.name === 'gate-pass-documents');
      if (gatePassBucket) {
        console.log('\n🎉 gate-pass-documents bucket is ready for file uploads!');
      } else {
        console.log('\n⚠️  gate-pass-documents bucket was not created successfully');
      }
    }
  } catch (err) {
    console.log('❌ Error verifying buckets:', err.message);
  }
  
  if (successCount === requiredBuckets.length) {
    console.log('\n🎉 All storage buckets created successfully!');
  } else {
    console.log('\n⚠️  Some buckets failed to create. Check the errors above.');
  }
}

createStorageBuckets();