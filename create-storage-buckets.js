import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const buckets = [
  {
    id: 'hero-images',
    name: 'hero-images',
    public: true,
    fileSizeLimit: 52428800, // 50MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  },
  {
    id: 'testimonial-photos',
    name: 'testimonial-photos',
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    id: 'program-icons',
    name: 'program-icons',
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  },
  {
    id: 'student-photos',
    name: 'student-photos',
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    id: 'document-uploads',
    name: 'document-uploads',
    public: false,
    fileSizeLimit: 104857600, // 100MB
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },
  {
    id: 'news-images',
    name: 'news-images',
    public: true,
    fileSizeLimit: 20971520, // 20MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  },
  {
    id: 'gallery-images',
    name: 'gallery-images',
    public: true,
    fileSizeLimit: 20971520, // 20MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    id: 'staff-photos',
    name: 'staff-photos',
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    id: 'cv-uploads',
    name: 'cv-uploads',
    public: false,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },
  {
    id: 'gate-pass-documents',
    name: 'gate-pass-documents',
    public: false,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
  },
  {
    id: 'program-images',
    name: 'program-images',
    public: true,
    fileSizeLimit: 20971520, // 20MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    id: 'program-thumbnails',
    name: 'program-thumbnails',
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    id: 'news-photos',
    name: 'news-photos',
    public: true,
    fileSizeLimit: 20971520, // 20MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  },
  {
    id: 'event-photos',
    name: 'event-photos',
    public: true,
    fileSizeLimit: 20971520, // 20MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  }
];

async function createStorageBuckets() {
  console.log('🚀 Creating storage buckets...\n');

  // First, check existing buckets
  const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('❌ Error listing existing buckets:', listError);
    return;
  }

  const existingBucketNames = existingBuckets.map(bucket => bucket.name);
  console.log('📁 Existing buckets:', existingBucketNames);

  for (const bucket of buckets) {
    if (existingBucketNames.includes(bucket.name)) {
      console.log(`✅ Bucket "${bucket.name}" already exists`);
      continue;
    }

    console.log(`📦 Creating bucket: ${bucket.name}...`);
    
    const { data, error } = await supabase.storage.createBucket(bucket.id, {
      public: bucket.public,
      fileSizeLimit: bucket.fileSizeLimit,
      allowedMimeTypes: bucket.allowedMimeTypes
    });

    if (error) {
      console.error(`❌ Error creating bucket "${bucket.name}":`, error.message);
    } else {
      console.log(`✅ Successfully created bucket: ${bucket.name}`);
    }
  }

  // Verify all buckets were created
  console.log('\n🔍 Verifying bucket creation...');
  const { data: finalBuckets, error: finalError } = await supabase.storage.listBuckets();
  
  if (finalError) {
    console.error('❌ Error verifying buckets:', finalError);
    return;
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total buckets expected: ${buckets.length}`);
  console.log(`   Total buckets found: ${finalBuckets.length}`);
  
  const missingBuckets = buckets.filter(bucket => 
    !finalBuckets.some(fb => fb.name === bucket.name)
  );

  if (missingBuckets.length === 0) {
    console.log('✅ All storage buckets created successfully!');
  } else {
    console.log(`❌ Missing buckets: ${missingBuckets.map(b => b.name).join(', ')}`);
  }
}

createStorageBuckets().catch(console.error);