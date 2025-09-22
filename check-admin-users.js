import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFixAdminUsers() {
  console.log('🔍 Checking admin users...');
  
  try {
    // Check existing users
    const { data: users, error: usersError } = await serviceClient.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.log('\n📋 Existing users:');
    users.users.forEach(user => {
      console.log(`- ${user.email} (ID: ${user.id})`);
      console.log(`  Role: ${user.user_metadata?.role || 'No role set'}`);
      console.log(`  Created: ${user.created_at}`);
    });
    
    // Find admin user
    const adminUser = users.users.find(user => 
      user.email === 'admin@modernhss.edu.in' || 
      user.user_metadata?.role === 'admin'
    );
    
    if (!adminUser) {
      console.log('\n❌ No admin user found. Creating one...');
      
      const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
        email: 'admin@modernhss.edu.in',
        password: 'admin123',
        email_confirm: true,
        user_metadata: {
          role: 'admin',
          full_name: 'System Administrator'
        }
      });
      
      if (createError) {
        console.error('❌ Error creating admin user:', createError);
      } else {
        console.log('✅ Admin user created successfully:', newUser.user.email);
      }
    } else {
      console.log('\n✅ Admin user found:', adminUser.email);
      
      // Reset password to ensure it's correct
      console.log('🔄 Resetting admin password...');
      const { data: updateData, error: updateError } = await serviceClient.auth.admin.updateUserById(
        adminUser.id,
        {
          password: 'admin123',
          user_metadata: {
            role: 'admin',
            full_name: adminUser.user_metadata?.full_name || 'System Administrator'
          }
        }
      );
      
      if (updateError) {
        console.error('❌ Error updating admin user:', updateError);
      } else {
        console.log('✅ Admin password reset successfully');
      }
    }
    
    // Test login with the credentials
    console.log('\n🔐 Testing admin login...');
    const anonClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
      email: 'admin@modernhss.edu.in',
      password: 'admin123'
    });
    
    if (authError) {
      console.error('❌ Login test failed:', authError);
    } else {
      console.log('✅ Login test successful!');
      console.log('User ID:', authData.user.id);
      console.log('User role:', authData.user.user_metadata?.role);
      
      // Sign out
      await anonClient.auth.signOut();
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkAndFixAdminUsers().catch(console.error);