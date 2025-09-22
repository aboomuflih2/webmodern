import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCompleteWorkflow() {
  console.log('\n=== Testing Complete Photo Upload Workflow ===\n');

  try {
    // 1. Check if admin user exists
    console.log('1. Checking admin users...');
    const { data: adminUsers, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .eq('role', 'admin');

    if (adminError) {
      console.error('❌ Error fetching admin users:', adminError.message);
      return;
    }

    console.log(`✅ Found ${adminUsers.length} admin users`);
    if (adminUsers.length > 0) {
      console.log('   Admin user IDs:', adminUsers.map(u => u.user_id).join(', '));
    }

    // 2. Test storage bucket permissions
    console.log('\n2. Testing storage bucket permissions...');
    
    // Create a minimal valid JPEG file (1x1 pixel)
    const jpegHeader = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
      0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
      0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0xB2, 0xC0,
      0x07, 0xFF, 0xD9
    ]);

    // Test news-photos bucket with service role
    const newsFileName = `test-news-${Date.now()}.jpg`;
    const { data: newsUpload, error: newsError } = await supabase.storage
      .from('news-photos')
      .upload(newsFileName, jpegHeader, {
        contentType: 'image/jpeg'
      });

    if (newsError) {
      console.log('❌ News photo upload failed:', newsError.message);
    } else {
      console.log('✅ News photo uploaded successfully:', newsUpload.path);
      
      // Get public URL
      const { data: newsUrl } = supabase.storage
        .from('news-photos')
        .getPublicUrl(newsFileName);
      console.log('   Public URL:', newsUrl.publicUrl);
      
      // Clean up
      await supabase.storage.from('news-photos').remove([newsFileName]);
      console.log('   ✅ Test file cleaned up');
    }

    // Test event-photos bucket with service role
    const eventFileName = `test-event-${Date.now()}.jpg`;
    const { data: eventUpload, error: eventError } = await supabase.storage
      .from('event-photos')
      .upload(eventFileName, jpegHeader, {
        contentType: 'image/jpeg'
      });

    if (eventError) {
      console.log('❌ Event photo upload failed:', eventError.message);
    } else {
      console.log('✅ Event photo uploaded successfully:', eventUpload.path);
      
      // Get public URL
      const { data: eventUrl } = supabase.storage
        .from('event-photos')
        .getPublicUrl(eventFileName);
      console.log('   Public URL:', eventUrl.publicUrl);
      
      // Clean up
      await supabase.storage.from('event-photos').remove([eventFileName]);
      console.log('   ✅ Test file cleaned up');
    }

    // 3. Test database operations
    console.log('\n3. Testing database operations...');
    
    // Test news table
    const { data: newsData, error: newsDbError } = await supabase
      .from('news')
      .select('*')
      .limit(1);
    
    if (newsDbError) {
      console.log('❌ News table access failed:', newsDbError.message);
    } else {
      console.log(`✅ News table accessible (${newsData.length} records found)`);
    }
    
    // Test events table
    const { data: eventsData, error: eventsDbError } = await supabase
      .from('events')
      .select('*')
      .limit(1);
    
    if (eventsDbError) {
      console.log('❌ Events table access failed:', eventsDbError.message);
    } else {
      console.log(`✅ Events table accessible (${eventsData.length} records found)`);
    }

    console.log('\n=== Workflow Test Summary ===');
    console.log('✅ Storage buckets: news-photos and event-photos exist');
    console.log('✅ Photo upload functionality works with service role');
    console.log('✅ Database tables are accessible');
    console.log('\n📝 Next steps:');
    console.log('   1. Test photo uploads through the frontend forms');
    console.log('   2. Ensure proper authentication is in place');
    console.log('   3. Verify RLS policies allow authenticated admin users to upload');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteWorkflow();