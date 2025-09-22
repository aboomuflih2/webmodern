import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUserRoles() {
  console.log('🔍 Testing user_roles table and is_admin function...');
  
  try {
    // 1. Check all users in auth.users
    console.log('\n1. Checking auth.users:');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('Error fetching auth users:', authError);
    } else {
      console.log('Auth users:', authUsers.users.map(u => ({ id: u.id, email: u.email })));
    }

    // 2. Check all entries in user_roles table
    console.log('\n2. Checking user_roles table:');
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');
    
    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
    } else {
      console.log('User roles:', userRoles);
    }

    // 3. Sign in as admin and test is_admin function
    console.log('\n3. Testing admin sign-in and is_admin function:');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@modernhss.edu.in',
      password: 'admin123'
    });

    if (signInError) {
      console.error('Admin sign-in error:', signInError);
      return;
    }

    console.log('Admin signed in successfully:', signInData.user.id);

    // 4. Test is_admin function with authenticated user
    console.log('\n4. Testing is_admin() function:');
    const { data: isAdminResult, error: isAdminError } = await supabase
      .rpc('is_admin');
    
    if (isAdminError) {
      console.error('is_admin function error:', isAdminError);
    } else {
      console.log('is_admin() result:', isAdminResult);
    }

    // 5. Check if user_roles entry exists for this user
    console.log('\n5. Checking user_roles for current user:');
    const { data: currentUserRole, error: currentRoleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', signInData.user.id);
    
    if (currentRoleError) {
      console.error('Error checking current user role:', currentRoleError);
    } else {
      console.log('Current user role:', currentUserRole);
      
      if (currentUserRole.length === 0) {
        console.log('\n⚠️  No role found for current user. Adding admin role...');
        const { data: insertRole, error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: signInData.user.id,
            role: 'admin'
          });
        
        if (insertError) {
          console.error('Error inserting admin role:', insertError);
        } else {
          console.log('✅ Admin role added successfully');
          
          // Test is_admin again
          const { data: isAdminResult2, error: isAdminError2 } = await supabase
            .rpc('is_admin');
          
          if (isAdminError2) {
            console.error('is_admin function error (retry):', isAdminError2);
          } else {
            console.log('is_admin() result after adding role:', isAdminResult2);
          }
        }
      }
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testUserRoles();