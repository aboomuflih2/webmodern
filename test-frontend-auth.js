import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

// Create Supabase client (like the frontend does)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFrontendAuth() {
  console.log('\n=== Testing Frontend Authentication Flow ===\n');
  
  try {
    // 1. Check current session
    console.log('1. Checking current session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session check failed:', sessionError.message);
      return;
    }
    
    if (session) {
      console.log('✅ User is logged in:', session.user.email);
      console.log('   User ID:', session.user.id);
    } else {
      console.log('ℹ️ No active session - user is anonymous');
    }
    
    // 2. Test is_admin() function as authenticated user (if logged in)
    if (session) {
      console.log('\n2. Testing is_admin() function as authenticated user...');
      const { data: isAdminResult, error: isAdminError } = await supabase
        .rpc('is_admin');
      
      if (isAdminError) {
        console.error('❌ is_admin() function failed:', isAdminError.message);
      } else {
        console.log('✅ is_admin() result for authenticated user:', isAdminResult);
      }
      
      // 3. Test form submission as authenticated user
      if (isAdminResult) {
        console.log('\n3. Testing form submission as authenticated admin...');
        const testFeature = {
          feature_title: 'Frontend Test Feature',
          feature_description: 'Added through frontend authentication test',
          icon_name: 'TestTube',
          is_active: true,
          display_order: 888
        };
        
        const { data: insertData, error: insertError } = await supabase
          .from('school_features')
          .insert([testFeature])
          .select();
        
        if (insertError) {
          console.error('❌ Authenticated admin insert failed:', insertError.message);
          console.error('Error details:', insertError);
        } else {
          console.log('✅ Authenticated admin insert successful!');
          console.log('   ID:', insertData[0].id);
          console.log('   Title:', insertData[0].feature_title);
          
          // Clean up
          await supabase.from('school_features').delete().eq('id', insertData[0].id);
          console.log('✅ Test record cleaned up');
        }
      } else {
        console.log('\n3. User is authenticated but not an admin - testing insert...');
        const { data: insertData, error: insertError } = await supabase
          .from('school_features')
          .insert([{
            feature_title: 'Non-admin test',
            feature_description: 'Should fail',
            icon_name: 'X',
            is_active: true,
            display_order: 999
          }]);
        
        if (insertError) {
          console.log('✅ Non-admin insert correctly blocked:', insertError.message);
        } else {
          console.error('❌ Non-admin insert should have been blocked!');
          // Clean up
          await supabase.from('school_features').delete().eq('id', insertData[0].id);
        }
      }
    } else {
      console.log('\n2. Testing anonymous user form submission...');
      const { data: insertData, error: insertError } = await supabase
        .from('school_features')
        .insert([{
          feature_title: 'Anonymous test',
          feature_description: 'Should fail',
          icon_name: 'X',
          is_active: true,
          display_order: 999
        }]);
      
      if (insertError) {
        console.log('✅ Anonymous insert correctly blocked:', insertError.message);
      } else {
        console.error('❌ Anonymous insert should have been blocked!');
      }
    }
    
    // 4. Check available admin users for testing
    console.log('\n4. Available admin users for testing:');
    
    // We need to use a service role client to check this
    const serviceClient = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: adminUsers, error: adminError } = await serviceClient
      .from('user_roles')
      .select(`
        user_id,
        role,
        auth.users!inner(email)
      `)
      .eq('role', 'admin');
    
    if (adminError) {
      console.error('❌ Failed to fetch admin users:', adminError.message);
    } else {
      console.log('Available admin accounts:');
      adminUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. Email: ${user.users?.email || 'N/A'}`);
        console.log(`      User ID: ${user.user_id.substring(0, 8)}...`);
      });
    }
    
    console.log('\n=== Frontend Authentication Test Complete ===');
    console.log('\n💡 To test the form properly:');
    console.log('   1. Open http://localhost:8080/auth in your browser');
    console.log('   2. Log in with one of the admin accounts above');
    console.log('   3. Navigate to http://localhost:8080/admin/school-features');
    console.log('   4. Try adding a new feature through the form');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testFrontendAuth();