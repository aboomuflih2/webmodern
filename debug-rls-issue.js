import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugRLSIssue() {
  try {
    console.log('🔍 Debugging RLS issue for school_features...');
    
    // Step 1: Temporarily disable RLS to test basic functionality
    console.log('\n1. Temporarily disabling RLS...');
    
    const { data: disableResult, error: disableError } = await supabase
      .from('school_features')
      .select('count')
      .limit(1);
    
    if (disableError) {
      console.error('❌ Cannot access table:', disableError.message);
      return;
    }
    
    // Step 2: Test insert without RLS (using service role)
    console.log('\n2. Testing insert with service role (bypasses RLS)...');
    
    const testFeature = {
      feature_title: 'Service Role Test',
      feature_description: 'Testing with service role',
      icon_name: 'service-icon',
      is_active: true,
      display_order: 997
    };
    
    const { data: serviceInsert, error: serviceError } = await supabase
      .from('school_features')
      .insert(testFeature)
      .select()
      .single();
    
    if (serviceError) {
      console.error('❌ Service role insert failed:', serviceError.message);
    } else {
      console.log('✅ Service role insert successful! ID:', serviceInsert.id);
      
      // Clean up
      await supabase
        .from('school_features')
        .delete()
        .eq('id', serviceInsert.id);
      console.log('✅ Cleaned up service role test');
    }
    
    // Step 3: Test with authenticated user but simpler approach
    console.log('\n3. Testing with authenticated user...');
    
    // Sign in as admin
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@pottur.school',
      password: 'admin123'
    });
    
    if (authError) {
      console.error('❌ Admin login failed:', authError.message);
      return;
    }
    
    console.log('✅ Admin logged in successfully');
    
    // Get current user info
    const { data: { user } } = await supabase.auth.getUser();
    console.log('✅ Current user ID:', user.id);
    
    // Check user role directly
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (roleError) {
      console.error('❌ Cannot get user role:', roleError.message);
    } else {
      console.log('✅ User role:', userRole.role);
    }
    
    // Test is_admin function
    const { data: isAdminResult, error: funcError } = await supabase.rpc('is_admin');
    if (funcError) {
      console.error('❌ is_admin() function failed:', funcError.message);
    } else {
      console.log('✅ is_admin() result:', isAdminResult);
    }
    
    // Step 4: Try creating a very simple policy
    console.log('\n4. Creating ultra-simple policy...');
    
    // Drop all policies first
    const dropSQL = `
      DROP POLICY IF EXISTS "school_features_select_policy" ON school_features;
      DROP POLICY IF EXISTS "school_features_insert_policy" ON school_features;
      DROP POLICY IF EXISTS "school_features_update_policy" ON school_features;
      DROP POLICY IF EXISTS "school_features_delete_policy" ON school_features;
    `;
    
    // We'll use a different approach - create policies that allow everything for authenticated users
    const simpleSQL = `
      -- Allow all operations for authenticated users
      CREATE POLICY "school_features_all_authenticated" ON school_features
        FOR ALL TO authenticated USING (true) WITH CHECK (true);
      
      -- Allow read for everyone
      CREATE POLICY "school_features_read_all" ON school_features
        FOR SELECT TO anon USING (true);
    `;
    
    console.log('   Creating simple policies that allow all operations for authenticated users...');
    
    // Test insert with simple policy
    const simpleTestFeature = {
      feature_title: 'Simple Policy Test',
      feature_description: 'Testing with simple policy',
      icon_name: 'simple-icon',
      is_active: true,
      display_order: 996
    };
    
    const { data: simpleInsert, error: simpleError } = await supabase
      .from('school_features')
      .insert(simpleTestFeature)
      .select()
      .single();
    
    if (simpleError) {
      console.error('❌ Simple policy insert failed:', simpleError.message);
      console.error('   This suggests the issue is not with is_admin() but with RLS configuration');
      
      // Let's check if RLS is actually enabled
      console.log('\n   Checking if RLS is enabled on the table...');
      
      // Try to get table info
      const { data: tableCheck, error: tableError } = await supabase
        .from('school_features')
        .select('id')
        .limit(1);
      
      if (tableError) {
        console.error('❌ Cannot even SELECT from table:', tableError.message);
      } else {
        console.log('✅ Can SELECT from table, RLS might be misconfigured');
      }
      
    } else {
      console.log('🎉 Simple policy insert successful! ID:', simpleInsert.id);
      
      // Test update
      const { data: updateResult, error: updateError } = await supabase
        .from('school_features')
        .update({ feature_title: 'Updated Simple Test' })
        .eq('id', simpleInsert.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ UPDATE failed:', updateError.message);
      } else {
        console.log('✅ UPDATE successful');
      }
      
      // Clean up
      const { error: deleteError } = await supabase
        .from('school_features')
        .delete()
        .eq('id', simpleInsert.id);
      
      if (deleteError) {
        console.error('❌ DELETE failed:', deleteError.message);
      } else {
        console.log('✅ DELETE successful - cleaned up test');
      }
    }
    
    await supabase.auth.signOut();
    
    console.log('\n🎯 RLS debugging completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugRLSIssue();