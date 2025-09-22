// Test photo upload functionality
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'http://127.0.0.1:54323';
// Use service role key to bypass RLS policies
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPhotoUpload() {
  try {
    console.log('Testing photo upload functionality...');
    
    // Create a simple test image file (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xC2, 0x5D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    const fileName = `test-${Date.now()}.png`;
    const filePath = `board-members/${fileName}`;
    
    console.log(`\n1. Uploading test image: ${filePath}`);
    
    // Test upload to staff-photos bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('staff-photos')
      .upload(filePath, testImageBuffer, {
        contentType: 'image/png'
      });
    
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError);
      return;
    }
    
    console.log('✅ Upload successful:', uploadData);
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('staff-photos')
      .getPublicUrl(filePath);
    
    console.log('\n2. Generated public URL:', urlData.publicUrl);
    
    // Test updating a board member with this photo URL
    console.log('\n3. Testing database update...');
    
    // Get the first board member
    const { data: members, error: fetchError } = await supabase
      .from('board_members')
      .select('id, name, photo_url')
      .limit(1);
    
    if (fetchError || !members || members.length === 0) {
      console.error('❌ Failed to fetch board member:', fetchError);
      return;
    }
    
    const member = members[0];
    console.log(`Updating member: ${member.name} (ID: ${member.id})`);
    
    // Update the member with the photo URL
    const { data: updateData, error: updateError } = await supabase
      .from('board_members')
      .update({ photo_url: urlData.publicUrl })
      .eq('id', member.id)
      .select();
    
    if (updateError) {
      console.error('❌ Database update failed:', updateError);
    } else {
      console.log('✅ Database update successful:', updateData);
    }
    
    // Verify the update
    console.log('\n4. Verifying update...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('board_members')
      .select('id, name, photo_url')
      .eq('id', member.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
    } else {
      console.log('✅ Verification successful:');
      console.log(`- Name: ${verifyData.name}`);
      console.log(`- Photo URL: ${verifyData.photo_url}`);
    }
    
    // Clean up - delete the test file
    console.log('\n5. Cleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from('staff-photos')
      .remove([filePath]);
    
    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError);
    } else {
      console.log('✅ Cleanup successful');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPhotoUpload();