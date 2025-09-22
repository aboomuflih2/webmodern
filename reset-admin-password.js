import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetAdminPassword() {
  console.log('Resetting admin password...');
  
  try {
    // Get the admin user
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Failed to list users:', listError);
      return;
    }
    
    const adminUser = users.users.find(user => user.email === 'admin@pottur.school');
    
    if (!adminUser) {
      console.error('❌ Admin user not found');
      return;
    }
    
    console.log('Found admin user:', adminUser.email);
    
    // Reset password to a known value
    const newPassword = 'admin123';
    
    const { data, error } = await supabase.auth.admin.updateUserById(
      adminUser.id,
      { password: newPassword }
    );
    
    if (error) {
      console.error('❌ Failed to reset password:', error);
      return;
    }
    
    console.log('✅ Password reset successful!');
    console.log('New credentials:');
    console.log('Email: admin@pottur.school');
    console.log('Password: admin123');
    
    // Test the new credentials
    console.log('\nTesting new credentials...');
    
    // Create a new client with anon key for testing
    const testClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    const { data: signInData, error: signInError } = await testClient.auth.signInWithPassword({
      email: 'admin@pottur.school',
      password: newPassword
    });
    
    if (signInError) {
      console.error('❌ Test login failed:', signInError);
    } else {
      console.log('✅ Test login successful!');
      
      // Test photo upload
      console.log('\nTesting photo upload with authenticated user...');
      
      const testFile = Buffer.from('fake-image-data');
      const fileName = `test-reset-${Date.now()}.png`;
      
      const { data: uploadData, error: uploadError } = await testClient.storage
        .from('staff-photos')
        .upload(`board-members/${fileName}`, testFile, {
          contentType: 'image/png'
        });
      
      if (uploadError) {
        console.log('❌ Upload failed:', uploadError.message);
      } else {
        console.log('✅ Upload successful:', uploadData.path);
        
        // Clean up
        await testClient.storage
          .from('staff-photos')
          .remove([uploadData.path]);
        console.log('✅ Cleanup completed');
      }
      
      // Sign out
      await testClient.auth.signOut();
    }
    
  } catch (error) {
    console.error('❌ Reset failed:', error);
  }
}

resetAdminPassword();