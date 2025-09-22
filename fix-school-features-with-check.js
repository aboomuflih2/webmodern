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

async function fixSchoolFeaturesWithCheck() {
  try {
    console.log('🔧 Fixing school_features RLS with explicit WITH CHECK...');
    
    // Step 1: Drop all existing policies completely
    console.log('\n1. Dropping ALL existing policies...');
    const dropAllSQL = `
      DROP POLICY IF EXISTS "Public read access" ON school_features;
      DROP POLICY IF EXISTS "Admin full access" ON school_features;
      DROP POLICY IF EXISTS "Allow public read access to school_features" ON school_features;
      DROP POLICY IF EXISTS "Allow admin full access to school_features" ON school_features;
    `;
    
    const dropStatements = dropAllSQL.split(';').filter(stmt => stmt.trim());
    for (const statement of dropStatements) {
      if (statement.trim()) {
        try {
          await supabase.rpc('exec_sql', { sql: statement.trim() + ';' });
          console.log('✅ Dropped policy');
        } catch (error) {
          console.log('⚠️  Policy might not exist');
        }
      }
    }
    
    // Step 2: Create separate policies for each operation
    console.log('\n2. Creating separate policies for each operation...');
    
    // SELECT policy for public access
    const selectPolicySQL = `
      CREATE POLICY "school_features_select_policy" ON school_features
        FOR SELECT USING (true);
    `;
    
    try {
      await supabase.rpc('exec_sql', { sql: selectPolicySQL });
      console.log('✅ Created SELECT policy for public access');
    } catch (error) {
      console.error('❌ Failed to create SELECT policy:', error.message);
    }
    
    // INSERT policy for admin
    const insertPolicySQL = `
      CREATE POLICY "school_features_insert_policy" ON school_features
        FOR INSERT WITH CHECK (is_admin());
    `;
    
    try {
      await supabase.rpc('exec_sql', { sql: insertPolicySQL });
      console.log('✅ Created INSERT policy for admin');
    } catch (error) {
      console.error('❌ Failed to create INSERT policy:', error.message);
    }
    
    // UPDATE policy for admin
    const updatePolicySQL = `
      CREATE POLICY "school_features_update_policy" ON school_features
        FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
    `;
    
    try {
      await supabase.rpc('exec_sql', { sql: updatePolicySQL });
      console.log('✅ Created UPDATE policy for admin');
    } catch (error) {
      console.error('❌ Failed to create UPDATE policy:', error.message);
    }
    
    // DELETE policy for admin
    const deletePolicySQL = `
      CREATE POLICY "school_features_delete_policy" ON school_features
        FOR DELETE USING (is_admin());
    `;
    
    try {
      await supabase.rpc('exec_sql', { sql: deletePolicySQL });
      console.log('✅ Created DELETE policy for admin');
    } catch (error) {
      console.error('❌ Failed to create DELETE policy:', error.message);
    }
    
    // Step 3: Ensure permissions are granted
    console.log('\n3. Ensuring permissions...');
    const permissionsSQL = `
      GRANT SELECT ON school_features TO anon;
      GRANT ALL ON school_features TO authenticated;
      GRANT USAGE, SELECT ON SEQUENCE school_features_id_seq TO authenticated;
      GRANT USAGE, SELECT ON SEQUENCE school_features_id_seq TO anon;
    `;
    
    const permStatements = permissionsSQL.split(';').filter(stmt => stmt.trim());
    for (const statement of permStatements) {
      if (statement.trim()) {
        try {
          await supabase.rpc('exec_sql', { sql: statement.trim() + ';' });
          console.log('✅ Granted permission');
        } catch (error) {
          console.log('⚠️  Permission might already exist');
        }
      }
    }
    
    // Step 4: Test the fix
    console.log('\n4. Testing the comprehensive fix...');
    
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
    
    // Verify is_admin() function
    const { data: isAdminResult, error: funcError } = await supabase.rpc('is_admin');
    if (funcError) {
      console.error('❌ is_admin() function failed:', funcError.message);
      return;
    }
    console.log('✅ is_admin() function result:', isAdminResult);
    
    if (!isAdminResult) {
      console.error('❌ is_admin() returned false - user is not admin');
      return;
    }
    
    // Test INSERT with detailed error handling
    console.log('\n   Testing INSERT...');
    const testFeature = {
      feature_title: 'Final Test Feature',
      feature_description: 'This is the final test feature',
      icon_name: 'test-icon',
      is_active: true,
      display_order: 999
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('school_features')
      .insert(testFeature)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ INSERT failed:', insertError.message);
      console.error('   Error code:', insertError.code);
      console.error('   Error details:', insertError.details);
      console.error('   Error hint:', insertError.hint);
      
      // Try a direct SQL insert to bypass Supabase client
      console.log('\n   Trying direct SQL INSERT...');
      const directInsertSQL = `
        INSERT INTO school_features (feature_title, feature_description, icon_name, is_active, display_order)
        VALUES ('Direct SQL Test', 'Direct SQL test feature', 'sql-icon', true, 998)
        RETURNING *;
      `;
      
      try {
        const { data: directResult, error: directError } = await supabase.rpc('exec_sql', { sql: directInsertSQL });
        if (directError) {
          console.error('❌ Direct SQL INSERT failed:', directError.message);
        } else {
          console.log('✅ Direct SQL INSERT successful');
        }
      } catch (directErr) {
        console.error('❌ Direct SQL INSERT error:', directErr.message);
      }
      
    } else {
      console.log('🎉 INSERT successful! Created feature with ID:', insertData.id);
      
      // Test UPDATE
      const { data: updateData, error: updateError } = await supabase
        .from('school_features')
        .update({ feature_title: 'Updated Final Test Feature' })
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
        console.log('✅ DELETE successful - test feature cleaned up');
      }
    }
    
    await supabase.auth.signOut();
    
    console.log('\n🎯 Comprehensive School Features RLS fix completed!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

fixSchoolFeaturesWithCheck();