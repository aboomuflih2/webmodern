import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserRoles() {
  console.log('🔍 Checking user_roles table and authentication...\n');

  try {
    // Check if user_roles table exists
    console.log('1. Checking user_roles table:');
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('*');

    if (userRolesError) {
      console.error('❌ Error accessing user_roles table:', userRolesError);
    } else {
      console.log(`✅ Found ${userRoles?.length || 0} user role records`);
      userRoles?.forEach(role => {
        console.log(`   - User ${role.user_id}: ${role.role}`);
      });
    }

    // Check the specific user from the browser error
    const userId = 'ff791d19-7306-48f2-9f07-1e7531f73d88';
    console.log(`\n2. Checking specific user (${userId}):`);
    
    const { data: specificUser, error: specificUserError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);

    if (specificUserError) {
      console.error('❌ Error checking specific user:', specificUserError);
    } else if (specificUser && specificUser.length > 0) {
      console.log('✅ User found with roles:', specificUser.map(r => r.role).join(', '));
    } else {
      console.log('❌ User not found in user_roles table');
      console.log('💡 This might be why the admin check is failing!');
    }

    // Check auth.users table
    console.log('\n3. Checking auth.users table:');
    const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers();

    if (authUsersError) {
      console.error('❌ Error accessing auth.users:', authUsersError);
    } else {
      console.log(`✅ Found ${authUsers.users?.length || 0} authenticated users`);
      const targetUser = authUsers.users?.find(u => u.id === userId);
      if (targetUser) {
        console.log(`✅ Target user found: ${targetUser.email}`);
      } else {
        console.log('❌ Target user not found in auth.users');
      }
    }

    // Check social_media_links RLS policies specifically
    console.log('\n4. Testing social_media_links operations with service role:');
    const { data: insertTest, error: insertTestError } = await supabase
      .from('social_media_links')
      .insert([{
        platform: 'test_service',
        url: 'https://test-service.com',
        is_active: true,
        display_order: 997
      }]);

    if (insertTestError) {
      console.error('❌ Service role insert failed:', insertTestError);
    } else {
      console.log('✅ Service role insert succeeded');
      
      // Clean up
      await supabase
        .from('social_media_links')
        .delete()
        .eq('platform', 'test_service');
      console.log('🧹 Cleaned up test record');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkUserRoles();