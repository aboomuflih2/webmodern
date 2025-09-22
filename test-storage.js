// Test script to check Supabase storage functionality
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54323';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorage() {
  try {
    console.log('Testing Supabase storage...');
    
    // Test 1: List buckets
    console.log('\n1. Listing storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
    } else {
      console.log('Available buckets:', buckets.map(b => b.name));
      
      // Check if staff-photos bucket exists
      const staffPhotosBucket = buckets.find(b => b.name === 'staff-photos');
      if (staffPhotosBucket) {
        console.log('✅ staff-photos bucket exists');
      } else {
        console.log('❌ staff-photos bucket NOT found');
      }
    }
    
    // Test 2: Try to list files in staff-photos bucket
    console.log('\n2. Listing files in staff-photos bucket...');
    const { data: files, error: filesError } = await supabase.storage
      .from('staff-photos')
      .list();
    
    if (filesError) {
      console.error('Error listing files:', filesError);
    } else {
      console.log('Files in staff-photos:', files);
    }
    
    // Test 3: Test board members data
    console.log('\n3. Testing board members data...');
    const { data: members, error: membersError } = await supabase
      .from('board_members')
      .select('id, name, photo_url')
      .limit(5);
    
    if (membersError) {
      console.error('Error fetching board members:', membersError);
    } else {
      console.log('Board members:', members);
      members.forEach(member => {
        console.log(`- ${member.name}: photo_url = ${member.photo_url || 'NULL'}`);
      });
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testStorage();