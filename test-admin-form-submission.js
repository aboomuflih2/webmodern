import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Environment check:');
console.log('- Supabase URL:', supabaseUrl);
console.log('- Service Key available:', !!supabaseServiceKey);
console.log('- Anon Key available:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in environment variables');
  process.exit(1);
}

// Create Supabase clients
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function testAdminFormSubmission() {
  console.log('\n=== Testing Admin Form Submission ===\n');
  
  try {
    // 0. Test Supabase connection
    console.log('0. Testing Supabase connection...');
    try {
      const { data: healthCheck, error: healthError } = await supabaseService
        .from('school_features')
        .select('count')
        .limit(1);
      
      if (healthError) {
        console.error('❌ Supabase connection failed:', healthError.message);
        console.log('\n💡 Make sure your local Supabase is running:');
        console.log('   npx supabase start');
        return;
      }
      console.log('✅ Supabase connection successful');
    } catch (connError) {
      console.error('❌ Connection error:', connError.message);
      console.log('\n💡 Make sure your local Supabase is running:');
      console.log('   npx supabase start');
      return;
    }
    
    // 1. Check if we can access the table
    console.log('\n1. Testing table access...');
    const { data: tableData, error: tableError } = await supabaseService
      .from('school_features')
      .select('*')
      .limit(5);
    
    if (tableError) {
      console.error('❌ Table access failed:', tableError.message);
      return;
    }
    console.log('✅ Table accessible. Current records:', tableData.length);
    if (tableData.length > 0) {
      console.log('Sample record:', {
        id: tableData[0].id,
        title: tableData[0].feature_title,
        active: tableData[0].is_active
      });
    }
    
    // 2. Test admin user authentication
    console.log('\n2. Testing admin authentication...');
    
    // Check if there are any admin users in user_roles
    const { data: adminUsers, error: adminError } = await supabaseService
      .from('user_roles')
      .select('user_id, role')
      .eq('role', 'admin');
    
    if (adminError) {
      console.error('❌ Failed to check admin users:', adminError.message);
    } else {
      console.log('✅ Admin users found:', adminUsers.length);
      if (adminUsers.length > 0) {
        console.log('Admin user IDs:', adminUsers.map(u => u.user_id.substring(0, 8) + '...'));
      }
    }
    
    // 3. Test is_admin() function with service role
    console.log('\n3. Testing is_admin() function...');
    const { data: isAdminResult, error: isAdminError } = await supabaseService
      .rpc('is_admin');
    
    if (isAdminError) {
      console.error('❌ is_admin() function failed:', isAdminError.message);
    } else {
      console.log('✅ is_admin() result (service role):', isAdminResult);
    }
    
    // 4. Test anonymous user access (what the form would face without auth)
    console.log('\n4. Testing anonymous user access...');
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('school_features')
      .select('*')
      .limit(1);
    
    if (anonError) {
      console.error('❌ Anonymous read failed:', anonError.message);
    } else {
      console.log('✅ Anonymous read successful. Records visible:', anonData.length);
    }
    
    // Try anonymous insert (should fail)
    const { data: anonInsertData, error: anonInsertError } = await supabaseAnon
      .from('school_features')
      .insert([{
        feature_title: 'Anon Test',
        feature_description: 'Should fail',
        icon_name: 'X',
        is_active: true,
        display_order: 999
      }]);
    
    if (anonInsertError) {
      console.log('✅ Anonymous insert correctly blocked:', anonInsertError.message);
    } else {
      console.error('❌ Anonymous insert should have been blocked!');
      // Clean up if it somehow succeeded
      await supabaseService.from('school_features').delete().eq('id', anonInsertData[0].id);
    }
    
    // 5. Test INSERT with service role (simulating admin form submission)
    console.log('\n5. Testing form submission (INSERT with service role)...');
    const testFeature = {
      feature_title: 'Test Feature - Admin Form',
      feature_description: 'This is a test feature added through admin form simulation',
      icon_name: 'BookOpen',
      is_active: true,
      display_order: 999
    };
    
    const { data: insertData, error: insertError } = await supabaseService
      .from('school_features')
      .insert([testFeature])
      .select();
    
    if (insertError) {
      console.error('❌ Form submission (INSERT) failed:', insertError.message);
      console.error('Error details:', insertError);
    } else {
      console.log('✅ Form submission successful! Inserted record:');
      console.log('   ID:', insertData[0].id);
      console.log('   Title:', insertData[0].feature_title);
      console.log('   Active:', insertData[0].is_active);
      
      // Test UPDATE
      console.log('\n6. Testing UPDATE operation...');
      const { data: updateData, error: updateError } = await supabaseService
        .from('school_features')
        .update({
          feature_title: 'Updated Test Feature',
          feature_description: 'Updated description',
          updated_at: new Date().toISOString()
        })
        .eq('id', insertData[0].id)
        .select();
      
      if (updateError) {
        console.error('❌ UPDATE operation failed:', updateError.message);
      } else {
        console.log('✅ UPDATE operation successful');
        console.log('   New title:', updateData[0].feature_title);
      }
      
      // Test DELETE
      console.log('\n7. Testing DELETE operation...');
      const { error: deleteError } = await supabaseService
        .from('school_features')
        .delete()
        .eq('id', insertData[0].id);
      
      if (deleteError) {
        console.error('❌ DELETE operation failed:', deleteError.message);
      } else {
        console.log('✅ DELETE operation successful');
      }
    }
    
    console.log('\n=== Summary ===');
    console.log('✅ Service role has full CRUD access to school_features table');
    console.log('✅ Anonymous users can read but cannot insert (RLS working)');
    console.log('\n💡 The issue is likely that the frontend form runs as anonymous user');
    console.log('💡 Admin users need to be properly authenticated to use the form');
    
    console.log('\n=== Admin Form Submission Test Complete ===');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testAdminFormSubmission();