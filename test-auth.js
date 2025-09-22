import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('Testing authentication flow...');
  
  try {
    // 1. Check current session
    console.log('\n1. Checking current session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Current session:', session ? `User: ${session.user.email}` : 'No session');
    if (sessionError) console.log('Session error:', sessionError);
    
    // 2. Try to sign in with admin credentials
    console.log('\n2. Testing admin login...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@pottur.school',
      password: 'admin123' // Common default password
    });
    
    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message);
      
      // Try alternative passwords
      const passwords = ['password', 'admin', '123456', 'pottur123'];
      for (const pwd of passwords) {
        console.log(`Trying password: ${pwd}`);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'admin@pottur.school',
          password: pwd
        });
        if (!error) {
          console.log('✅ Login successful with password:', pwd);
          break;
        }
      }
    } else {
      console.log('✅ Sign in successful:', signInData.user.email);
    }
    
    // 3. Check session after login
    console.log('\n3. Checking session after login...');
    const { data: { session: newSession } } = await supabase.auth.getSession();
    console.log('New session:', newSession ? `User: ${newSession.user.email}` : 'No session');
    
    // 4. Test admin role check
    if (newSession) {
      console.log('\n4. Testing admin role check...');
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', newSession.user.id)
        .eq('role', 'admin')
        .limit(1);
      
      console.log('Admin role check:', { data: roleData, error: roleError });
      const isAdmin = !roleError && roleData && roleData.length > 0;
      console.log('Is admin:', isAdmin);
      
      // 5. Test photo upload with authenticated user
      if (isAdmin) {
        console.log('\n5. Testing photo upload as authenticated admin...');
        
        // Create a simple test file
        const testFile = Buffer.from('fake-image-data');
        const fileName = `test-auth-${Date.now()}.png`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('staff-photos')
          .upload(`board-members/${fileName}`, testFile, {
            contentType: 'image/png'
          });
        
        if (uploadError) {
          console.log('❌ Upload failed:', uploadError.message);
        } else {
          console.log('✅ Upload successful:', uploadData.path);
          
          // Clean up
          await supabase.storage
            .from('staff-photos')
            .remove([uploadData.path]);
          console.log('✅ Cleanup completed');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAuth();