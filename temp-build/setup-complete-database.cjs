const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function setupCompleteDatabase() {
  console.log('🚀 Setting up complete database with all tables and buckets...\n');
  
  try {
    // 1. Create all required storage buckets
    console.log('📦 Creating storage buckets...');
    
    const requiredBuckets = [
      { name: 'hero-images', public: true },
      { name: 'testimonial-photos', public: true },
      { name: 'program-icons', public: true },
      { name: 'student-photos', public: true },
      { name: 'document-uploads', public: false },
      { name: 'news-images', public: true },
      { name: 'gallery-images', public: true },
      { name: 'staff-photos', public: true },
      { name: 'cv-uploads', public: false },
      { name: 'gate-pass-documents', public: false },
      { name: 'program-images', public: true },
      { name: 'program-thumbnails', public: true },
      { name: 'news-photos', public: true },
      { name: 'event-photos', public: true }
    ];
    
    for (const bucket of requiredBuckets) {
      try {
        const { data, error } = await supabase.storage.createBucket(bucket.name, {
          public: bucket.public,
          allowedMimeTypes: ['image/*', 'application/pdf', 'text/*'],
          fileSizeLimit: 10485760 // 10MB
        });
        
        if (error && !error.message.includes('already exists')) {
          console.log(`❌ Error creating bucket ${bucket.name}:`, error.message);
        } else {
          console.log(`✅ Bucket ${bucket.name} ready (${bucket.public ? 'public' : 'private'})`);
        }
      } catch (err) {
        console.log(`❌ Exception creating bucket ${bucket.name}:`, err.message);
      }
    }
    
    // 2. Check which tables exist
    console.log('\n📋 Checking existing tables...');
    
    const expectedTables = [
      'admission_forms',
      'job_applications', 
      'gate_pass_requests',
      'news',
      'news_posts',
      'academic_programs',
      'board_members',
      'school_features',
      'tickets',
      'user_roles',
      'hero_slides',
      'breaking_news',
      'contact_submissions',
      'events',
      'gallery_photos',
      'interview_subject_templates',
      'interview_subjects',
      'kg_std_applications',
      'leadership_messages',
      'page_content',
      'plus_one_applications',
      'school_stats',
      'social_media_links',
      'staff_counts',
      'testimonials',
      'article_comments',
      'article_likes',
      'contact_page_content',
      'contact_addresses',
      'contact_locations'
    ];
    
    const existingTables = [];
    const missingTables = [];
    
    for (const table of expectedTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          missingTables.push(table);
        } else {
          existingTables.push(table);
        }
      } catch (err) {
        missingTables.push(table);
      }
    }
    
    console.log(`✅ Existing tables (${existingTables.length}):`);
    existingTables.forEach(table => console.log(`   - ${table}`));
    
    console.log(`\n❌ Missing tables (${missingTables.length}):`);
    missingTables.forEach(table => console.log(`   - ${table}`));
    
    // 3. Check storage buckets
    console.log('\n🗂️ Verifying storage buckets...');
    
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.log('❌ Error listing buckets:', bucketsError.message);
      } else {
        console.log(`✅ Found ${buckets.length} storage buckets:`);
        buckets.forEach(bucket => {
          console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
        });
        
        const missingBuckets = requiredBuckets.filter(req => 
          !buckets.find(existing => existing.name === req.name)
        );
        
        if (missingBuckets.length > 0) {
          console.log(`\n❌ Missing buckets (${missingBuckets.length}):`);
          missingBuckets.forEach(bucket => console.log(`   - ${bucket.name}`));
        } else {
          console.log('\n✅ All required buckets exist!');
        }
      }
    } catch (err) {
      console.log('❌ Exception checking storage:', err.message);
    }
    
    // 4. Test critical functions
    console.log('\n🔧 Testing critical functions...');
    
    try {
      const { data, error } = await supabase.rpc('is_admin');
      if (error) {
        console.log('❌ is_admin() function missing:', error.message);
      } else {
        console.log('✅ is_admin() function exists');
      }
    } catch (err) {
      console.log('❌ Error testing is_admin():', err.message);
    }
    
    // 5. Summary
    console.log('\n📊 Setup Summary:');
    console.log(`   Tables: ${existingTables.length}/${expectedTables.length} exist`);
    console.log(`   Missing tables: ${missingTables.length}`);
    console.log(`   Storage buckets: ${buckets?.length || 0}/${requiredBuckets.length} expected`);
    
    if (missingTables.length > 0) {
      console.log('\n⚠️  Some tables are missing. You may need to:');
      console.log('   1. Run: npx supabase db reset --debug');
      console.log('   2. Or manually apply specific migrations');
    }
    
    if (missingTables.length === 0 && buckets?.length >= requiredBuckets.length) {
      console.log('\n🎉 Database setup complete! All tables and buckets are ready.');
    }
    
  } catch (err) {
    console.log('❌ General error:', err.message);
  }
}

setupCompleteDatabase();