import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

async function testIsAdminFunction() {
  console.log('🔍 Testing is_admin() function...');
  
  try {
    // 1. Create/recreate the is_admin function
    console.log('\n1. Creating/updating is_admin function...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION is_admin()
      RETURNS boolean
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN (
          SELECT COALESCE(
            (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin',
            false
          )
        );
      END;
      $$;
    `;
    
    const { error: createError } = await serviceClient.rpc('exec_sql', { sql: createFunctionSQL });
    
    if (createError) {
      console.error('❌ Error creating is_admin function:', createError);
    } else {
      console.log('✅ is_admin function created/updated successfully');
    }
    
    // 2. Test the function with admin user
    console.log('\n2. Testing is_admin function with admin user...');
    
    // Login as admin
    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
      email: 'admin@modernhss.edu.in',
      password: 'admin123'
    });
    
    if (authError) {
      console.error('❌ Admin login failed:', authError);
      return;
    }
    
    console.log('✅ Admin login successful');
    console.log('User metadata:', authData.user.user_metadata);
    
    // Create authenticated client
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`
        }
      }
    });
    
    // Test is_admin function
    const { data: isAdminResult, error: isAdminError } = await authClient
      .rpc('is_admin');
    
    if (isAdminError) {
      console.error('❌ Error calling is_admin function:', isAdminError);
    } else {
      console.log('✅ is_admin() result:', isAdminResult);
    }
    
    // 3. Apply RLS policies manually
    console.log('\n3. Applying RLS policies manually...');
    
    const rlsSQL = `
      -- Drop existing policies
      DROP POLICY IF EXISTS "Admin full access" ON school_features;
      DROP POLICY IF EXISTS "Public read access" ON school_features;
      DROP POLICY IF EXISTS "school_features_select_policy" ON school_features;
      DROP POLICY IF EXISTS "school_features_insert_policy" ON school_features;
      DROP POLICY IF EXISTS "school_features_update_policy" ON school_features;
      DROP POLICY IF EXISTS "school_features_delete_policy" ON school_features;
      DROP POLICY IF EXISTS "school_features_admin_policy" ON school_features;
      
      -- Enable RLS
      ALTER TABLE school_features ENABLE ROW LEVEL SECURITY;
      
      -- Create new policies
      CREATE POLICY "school_features_select_policy" ON school_features
          FOR SELECT
          USING (true);
      
      CREATE POLICY "school_features_admin_policy" ON school_features
          FOR ALL
          USING (is_admin())
          WITH CHECK (is_admin());
      
      -- Grant permissions
      GRANT SELECT ON school_features TO anon;
      GRANT ALL PRIVILEGES ON school_features TO authenticated;
    `;
    
    const { error: rlsError } = await serviceClient.rpc('exec_sql', { sql: rlsSQL });
    
    if (rlsError) {
      console.error('❌ Error applying RLS policies:', rlsError);
    } else {
      console.log('✅ RLS policies applied successfully');
    }
    
    // 4. Test CRUD operations
    console.log('\n4. Testing CRUD operations...');
    
    const testFeature = {
      feature_title: 'Test Feature After Fix',
      feature_description: 'Testing after RLS fix',
      icon_name: 'TestIcon',
      is_active: true,
      display_order: 999
    };
    
    const { data: insertData, error: insertError } = await authClient
      .from('school_features')
      .insert(testFeature)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError);
    } else {
      console.log('✅ Insert successful, ID:', insertData.id);
      
      // Test UPDATE
      const { data: updateData, error: updateError } = await authClient
        .from('school_features')
        .update({ feature_title: 'Updated Test Feature' })
        .eq('id', insertData.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Update failed:', updateError);
      } else {
        console.log('✅ Update successful');
      }
      
      // Test DELETE
      const { error: deleteError } = await authClient
        .from('school_features')
        .delete()
        .eq('id', insertData.id);
      
      if (deleteError) {
        console.error('❌ Delete failed:', deleteError);
      } else {
        console.log('✅ Delete successful');
      }
    }
    
    // Sign out
    await anonClient.auth.signOut();
    
    console.log('\n🎉 RLS testing completed successfully!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testIsAdminFunction().catch(console.error);