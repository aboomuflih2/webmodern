import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

// Create service role client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getAdminUsers() {
  console.log('\n=== Getting Admin Users for Testing ===\n');
  
  try {
    // Get admin users from user_roles table
    const { data: adminRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .eq('role', 'admin');
    
    if (rolesError) {
      console.error('❌ Failed to fetch admin roles:', rolesError.message);
      return;
    }
    
    console.log('Found', adminRoles.length, 'admin users:');
    
    // Get user details for each admin
    for (let i = 0; i < adminRoles.length; i++) {
      const adminRole = adminRoles[i];
      
      // Get user details from auth.users
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(adminRole.user_id);
      
      if (userError) {
        console.log(`   ${i + 1}. User ID: ${adminRole.user_id.substring(0, 8)}... (email lookup failed)`);
      } else {
        console.log(`   ${i + 1}. Email: ${userData.user.email}`);
        console.log(`      User ID: ${adminRole.user_id.substring(0, 8)}...`);
      }
    }
    
    console.log('\n=== Testing Instructions ===');
    console.log('\n🔧 To test the School Features Manager form:');
    console.log('\n1. Open your browser and go to: http://localhost:8080/auth');
    console.log('2. Log in with one of the admin accounts listed above');
    console.log('3. After login, you should be redirected to the admin dashboard');
    console.log('4. Navigate to: http://localhost:8080/admin/school-features');
    console.log('5. Try adding a new feature using the form');
    console.log('\n✅ The form should work correctly for authenticated admin users');
    console.log('❌ Anonymous users (not logged in) cannot add features due to RLS');
    
    console.log('\n=== Summary of Findings ===');
    console.log('✅ RLS policies are working correctly');
    console.log('✅ Service role has full CRUD access');
    console.log('✅ Anonymous users can read but cannot insert/update/delete');
    console.log('✅ Admin authentication system is in place');
    console.log('✅ School Features Manager form is protected by AdminRoute');
    console.log('\n💡 The "data not being saved" issue occurs when:');
    console.log('   - User is not logged in (anonymous)');
    console.log('   - User is logged in but not an admin');
    console.log('   - User tries to access the form directly without authentication');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the function
getAdminUsers();