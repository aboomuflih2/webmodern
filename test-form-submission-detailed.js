import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

// Create clients
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

async function testFormSubmission() {
  console.log('=== Testing School Features Form Submission ===\n');

  // Test 1: Check current table state
  console.log('1. Checking current table state...');
  try {
    const { data, error } = await supabaseAnon
      .from('school_features')
      .select('*')
      .order('display_order');
    
    if (error) {
      console.error('❌ Error reading table:', error.message);
    } else {
      console.log(`✅ Table accessible. Current records: ${data.length}`);
      if (data.length > 0) {
        console.log('   Sample record:', data[0]);
      }
    }
  } catch (err) {
    console.error('❌ Exception reading table:', err.message);
  }

  // Test 2: Test anonymous user INSERT (should fail)
  console.log('\n2. Testing anonymous user INSERT (should fail due to RLS)...');
  try {
    const testFeature = {
      feature_title: 'Test Feature Anonymous',
      feature_description: 'This is a test feature from anonymous user',
      icon_name: 'GraduationCap',
      display_order: 999,
      is_active: true
    };

    const { data, error } = await supabaseAnon
      .from('school_features')
      .insert([testFeature])
      .select()
      .single();

    if (error) {
      console.log('✅ Anonymous INSERT correctly blocked:', error.message);
    } else {
      console.log('❌ Anonymous INSERT succeeded (this should not happen):', data);
      // Clean up
      await supabaseService.from('school_features').delete().eq('id', data.id);
    }
  } catch (err) {
    console.log('✅ Anonymous INSERT blocked by exception:', err.message);
  }

  // Test 3: Test service role INSERT (should succeed)
  console.log('\n3. Testing service role INSERT (should succeed)...');
  let testRecordId = null;
  try {
    const testFeature = {
      feature_title: 'Test Feature Service',
      feature_description: 'This is a test feature from service role',
      icon_name: 'Trophy',
      display_order: 998,
      is_active: true
    };

    const { data, error } = await supabaseService
      .from('school_features')
      .insert([testFeature])
      .select()
      .single();

    if (error) {
      console.error('❌ Service role INSERT failed:', error.message);
    } else {
      console.log('✅ Service role INSERT succeeded:', data.id);
      testRecordId = data.id;
    }
  } catch (err) {
    console.error('❌ Service role INSERT exception:', err.message);
  }

  // Test 4: Test authenticated user simulation
  console.log('\n4. Testing authenticated user simulation...');
  try {
    // First, let's check if we can simulate an admin user
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'testpassword123'
    });

    if (authError) {
      console.log('ℹ️  No test admin user available:', authError.message);
      console.log('   This is expected if no test user is set up.');
    } else {
      console.log('✅ Authenticated as:', authData.user.email);
      
      // Test INSERT as authenticated user
      const testFeature = {
        feature_title: 'Test Feature Authenticated',
        feature_description: 'This is a test feature from authenticated user',
        icon_name: 'Shield',
        display_order: 997,
        is_active: true
      };

      const { data, error } = await supabaseAnon
        .from('school_features')
        .insert([testFeature])
        .select()
        .single();

      if (error) {
        console.log('❌ Authenticated user INSERT failed:', error.message);
      } else {
        console.log('✅ Authenticated user INSERT succeeded:', data.id);
        // Clean up
        await supabaseService.from('school_features').delete().eq('id', data.id);
      }

      // Sign out
      await supabaseAnon.auth.signOut();
    }
  } catch (err) {
    console.log('ℹ️  Authentication test skipped:', err.message);
  }

  // Test 5: Check is_admin() function
  console.log('\n5. Testing is_admin() function...');
  try {
    const { data, error } = await supabaseService.rpc('is_admin');
    if (error) {
      console.error('❌ is_admin() function error:', error.message);
    } else {
      console.log('✅ is_admin() function result:', data);
    }
  } catch (err) {
    console.error('❌ is_admin() function exception:', err.message);
  }

  // Test 6: Check RLS policies
  console.log('\n6. Checking RLS policies...');
  try {
    const { data, error } = await supabaseService
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'school_features');
    
    if (error) {
      console.error('❌ Error checking policies:', error.message);
    } else {
      console.log(`✅ Found ${data.length} RLS policies for school_features:`);
      data.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd} (${policy.roles})`);
      });
    }
  } catch (err) {
    console.error('❌ Exception checking policies:', err.message);
  }

  // Cleanup
  if (testRecordId) {
    console.log('\n7. Cleaning up test record...');
    try {
      const { error } = await supabaseService
        .from('school_features')
        .delete()
        .eq('id', testRecordId);
      
      if (error) {
        console.error('❌ Cleanup failed:', error.message);
      } else {
        console.log('✅ Test record cleaned up successfully');
      }
    } catch (err) {
      console.error('❌ Cleanup exception:', err.message);
    }
  }

  console.log('\n=== Form Submission Test Complete ===');
}

testFormSubmission().catch(console.error);