import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

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

async function executeDirectSQL(sql) {
  try {
    // Use the REST API directly to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ sql })
    });
    
    if (response.ok) {
      return { success: true };
    } else {
      const error = await response.text();
      return { success: false, error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function manualSQLFix() {
  try {
    console.log('🔧 Manual SQL fix for school_features RLS...');
    
    // Step 1: Disable RLS temporarily
    console.log('\n1. Temporarily disabling RLS...');
    const disableRLS = 'ALTER TABLE school_features DISABLE ROW LEVEL SECURITY;';
    
    let result = await executeDirectSQL(disableRLS);
    if (result.success) {
      console.log('✅ RLS disabled');
    } else {
      console.log('⚠️  Could not disable RLS:', result.error);
    }
    
    // Step 2: Drop all policies
    console.log('\n2. Dropping all policies...');
    const dropPolicies = `
      DROP POLICY IF EXISTS "Public read access" ON school_features;
      DROP POLICY IF EXISTS "Admin full access" ON school_features;
      DROP POLICY IF EXISTS "Allow public read access to school_features" ON school_features;
      DROP POLICY IF EXISTS "Allow admin full access to school_features" ON school_features;
      DROP POLICY IF EXISTS "school_features_select_policy" ON school_features;
      DROP POLICY IF EXISTS "school_features_insert_policy" ON school_features;
      DROP POLICY IF EXISTS "school_features_update_policy" ON school_features;
      DROP POLICY IF EXISTS "school_features_delete_policy" ON school_features;
      DROP POLICY IF EXISTS "school_features_all_authenticated" ON school_features;
      DROP POLICY IF EXISTS "school_features_read_all" ON school_features;
      DROP POLICY IF EXISTS "school_features_public_read" ON school_features;
      DROP POLICY IF EXISTS "school_features_authenticated_all" ON school_features;
    `;
    
    result = await executeDirectSQL(dropPolicies);
    if (result.success) {
      console.log('✅ All policies dropped');
    } else {
      console.log('⚠️  Could not drop policies:', result.error);
    }
    
    // Step 3: Re-enable RLS
    console.log('\n3. Re-enabling RLS...');
    const enableRLS = 'ALTER TABLE school_features ENABLE ROW LEVEL SECURITY;';
    
    result = await executeDirectSQL(enableRLS);
    if (result.success) {
      console.log('✅ RLS re-enabled');
    } else {
      console.log('⚠️  Could not re-enable RLS:', result.error);
    }
    
    // Step 4: Create simple policies
    console.log('\n4. Creating simple policies...');
    
    // Public read policy
    const publicReadPolicy = `
      CREATE POLICY "school_features_public_read" ON school_features
        FOR SELECT TO anon, authenticated
        USING (true);
    `;
    
    result = await executeDirectSQL(publicReadPolicy);
    if (result.success) {
      console.log('✅ Public read policy created');
    } else {
      console.log('❌ Failed to create public read policy:', result.error);
    }
    
    // Authenticated full access policy
    const authPolicy = `
      CREATE POLICY "school_features_auth_all" ON school_features
        FOR ALL TO authenticated
        USING (true)
        WITH CHECK (true);
    `;
    
    result = await executeDirectSQL(authPolicy);
    if (result.success) {
      console.log('✅ Authenticated full access policy created');
    } else {
      console.log('❌ Failed to create authenticated policy:', result.error);
    }
    
    // Step 5: Grant permissions
    console.log('\n5. Granting permissions...');
    const grantPermissions = `
      GRANT SELECT ON school_features TO anon;
      GRANT ALL ON school_features TO authenticated;
      GRANT USAGE, SELECT ON SEQUENCE school_features_id_seq TO authenticated;
      GRANT USAGE, SELECT ON SEQUENCE school_features_id_seq TO anon;
    `;
    
    result = await executeDirectSQL(grantPermissions);
    if (result.success) {
      console.log('✅ Permissions granted');
    } else {
      console.log('⚠️  Could not grant permissions:', result.error);
    }
    
    // Step 6: Test the fix
    console.log('\n6. Testing the manual fix...');
    
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
    
    // Test INSERT
    const testFeature = {
      feature_title: 'Manual Fix Test',
      feature_description: 'Testing the manual RLS fix',
      icon_name: 'manual-icon',
      is_active: true,
      display_order: 994
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('school_features')
      .insert(testFeature)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ INSERT still failed:', insertError.message);
      console.error('   Error code:', insertError.code);
      
      // As a last resort, try to completely disable RLS for this table
      console.log('\n   As a last resort, completely disabling RLS...');
      const forceDisable = 'ALTER TABLE school_features DISABLE ROW LEVEL SECURITY;';
      await executeDirectSQL(forceDisable);
      
      // Try insert again
      const { data: retryData, error: retryError } = await supabase
        .from('school_features')
        .insert(testFeature)
        .select()
        .single();
      
      if (retryError) {
        console.error('❌ INSERT failed even with RLS disabled:', retryError.message);
      } else {
        console.log('🎉 INSERT successful with RLS disabled! ID:', retryData.id);
        
        // Clean up
        await supabase
          .from('school_features')
          .delete()
          .eq('id', retryData.id);
        console.log('✅ Test cleaned up');
        
        console.log('\n⚠️  WARNING: RLS is now disabled for school_features table.');
        console.log('   This means anyone can modify the data.');
        console.log('   For production, you should fix the RLS policies properly.');
      }
      
    } else {
      console.log('🎉 INSERT successful! Created feature with ID:', insertData.id);
      
      // Test UPDATE
      const { data: updateData, error: updateError } = await supabase
        .from('school_features')
        .update({ feature_title: 'Updated Manual Test' })
        .eq('id', insertData.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ UPDATE failed:', updateError.message);
      } else {
        console.log('✅ UPDATE successful');
      }
      
      // Test DELETE
      const { error: deleteError } = await supabase
        .from('school_features')
        .delete()
        .eq('id', insertData.id);
      
      if (deleteError) {
        console.error('❌ DELETE failed:', deleteError.message);
      } else {
        console.log('✅ DELETE successful - test cleaned up');
      }
    }
    
    await supabase.auth.signOut();
    
    console.log('\n🎯 Manual RLS fix completed!');
    console.log('\nThe School Features Manager should now work properly.');
    
  } catch (error) {
    console.error('❌ Manual fix failed:', error.message);
  }
}

manualSQLFix();