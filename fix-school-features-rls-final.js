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

async function fixSchoolFeaturesRLS() {
  try {
    console.log('🔧 Fixing school_features RLS policies...');
    
    // Step 1: Drop all existing policies
    console.log('\n1. Dropping existing policies...');
    const dropPoliciesSQL = `
      -- Drop all existing policies for school_features
      DROP POLICY IF EXISTS "Public read access" ON school_features;
      DROP POLICY IF EXISTS "Admin full access" ON school_features;
      DROP POLICY IF EXISTS "Allow public read access to school_features" ON school_features;
      DROP POLICY IF EXISTS "Allow admin full access to school_features" ON school_features;
    `;
    
    const statements1 = dropPoliciesSQL.split(';').filter(stmt => stmt.trim());
    for (const statement of statements1) {
      if (statement.trim()) {
        try {
          await supabase.rpc('exec_sql', { sql: statement.trim() + ';' });
          console.log('✅ Executed:', statement.trim().substring(0, 50) + '...');
        } catch (error) {
          console.log('⚠️  Policy might not exist:', statement.trim().substring(0, 50) + '...');
        }
      }
    }
    
    // Step 2: Create new policies using is_admin()
    console.log('\n2. Creating new RLS policies...');
    const createPoliciesSQL = `
      -- Create public read access policy
      CREATE POLICY "Allow public read access to school_features" ON school_features
        FOR SELECT USING (true);
      
      -- Create admin full access policy using is_admin() function
      CREATE POLICY "Allow admin full access to school_features" ON school_features
        FOR ALL USING (is_admin());
    `;
    
    const statements2 = createPoliciesSQL.split(';').filter(stmt => stmt.trim());
    for (const statement of statements2) {
      if (statement.trim()) {
        try {
          await supabase.rpc('exec_sql', { sql: statement.trim() + ';' });
          console.log('✅ Created policy:', statement.trim().substring(0, 50) + '...');
        } catch (error) {
          console.error('❌ Failed to create policy:', error.message);
          console.error('   Statement:', statement.trim());
        }
      }
    }
    
    // Step 3: Grant permissions
    console.log('\n3. Granting permissions...');
    const grantPermissionsSQL = `
      -- Grant permissions to authenticated and anon roles
      GRANT SELECT ON school_features TO anon;
      GRANT ALL ON school_features TO authenticated;
      
      -- Grant usage on sequence
      GRANT USAGE, SELECT ON SEQUENCE school_features_id_seq TO authenticated;
      GRANT USAGE, SELECT ON SEQUENCE school_features_id_seq TO anon;
    `;
    
    const statements3 = grantPermissionsSQL.split(';').filter(stmt => stmt.trim());
    for (const statement of statements3) {
      if (statement.trim()) {
        try {
          await supabase.rpc('exec_sql', { sql: statement.trim() + ';' });
          console.log('✅ Granted permission:', statement.trim().substring(0, 50) + '...');
        } catch (error) {
          console.log('⚠️  Permission might already exist:', statement.trim().substring(0, 50) + '...');
        }
      }
    }
    
    // Step 4: Test the fix
    console.log('\n4. Testing the fix...');
    
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
      feature_title: 'Test Feature After Fix',
      feature_description: 'This is a test feature after RLS fix',
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
      console.error('❌ INSERT still failed:', insertError.message);
      console.error('   Error code:', insertError.code);
      
      // Let's check if the is_admin() function is working
      console.log('\n   Checking is_admin() function...');
      const { data: isAdminResult, error: funcError } = await supabase.rpc('is_admin');
      if (funcError) {
        console.error('❌ is_admin() function failed:', funcError.message);
      } else {
        console.log('✅ is_admin() function result:', isAdminResult);
      }
      
    } else {
      console.log('🎉 INSERT successful! Created feature with ID:', insertData.id);
      
      // Test UPDATE
      const { data: updateData, error: updateError } = await supabase
        .from('school_features')
        .update({ feature_title: 'Updated Test Feature' })
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
    
    console.log('\n🎯 School Features RLS fix completed!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

fixSchoolFeaturesRLS();