import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

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

async function executeSQL(sql, description) {
  try {
    // Use the service role to execute SQL directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({ sql })
    });
    
    if (!response.ok) {
      // Try alternative approach using direct SQL execution
      const { data, error } = await supabase.rpc('exec', { sql });
      if (error) {
        console.log(`⚠️  ${description}: ${error.message}`);
        return false;
      }
    }
    
    console.log(`✅ ${description}`);
    return true;
  } catch (error) {
    console.log(`⚠️  ${description}: ${error.message}`);
    return false;
  }
}

async function finalRLSFix() {
  try {
    console.log('🔧 Final RLS fix for school_features...');
    
    // Step 1: Create a comprehensive SQL script
    const fixSQL = `
-- Final fix for school_features RLS policies
-- Drop all existing policies
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

-- Create new policies
-- Allow public read access
CREATE POLICY "school_features_public_read" ON school_features
  FOR SELECT TO anon, authenticated
  USING (true);

-- Allow authenticated users full access (simplified for now)
CREATE POLICY "school_features_authenticated_all" ON school_features
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT ON school_features TO anon;
GRANT ALL ON school_features TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE school_features_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE school_features_id_seq TO anon;
    `;
    
    // Write the SQL to a file for manual execution if needed
    fs.writeFileSync('fix-school-features-final.sql', fixSQL);
    console.log('✅ SQL script written to fix-school-features-final.sql');
    
    // Step 2: Execute each statement individually
    console.log('\n1. Dropping existing policies...');
    
    const dropStatements = [
      'DROP POLICY IF EXISTS "Public read access" ON school_features;',
      'DROP POLICY IF EXISTS "Admin full access" ON school_features;',
      'DROP POLICY IF EXISTS "Allow public read access to school_features" ON school_features;',
      'DROP POLICY IF EXISTS "Allow admin full access to school_features" ON school_features;',
      'DROP POLICY IF EXISTS "school_features_select_policy" ON school_features;',
      'DROP POLICY IF EXISTS "school_features_insert_policy" ON school_features;',
      'DROP POLICY IF EXISTS "school_features_update_policy" ON school_features;',
      'DROP POLICY IF EXISTS "school_features_delete_policy" ON school_features;',
      'DROP POLICY IF EXISTS "school_features_all_authenticated" ON school_features;',
      'DROP POLICY IF EXISTS "school_features_read_all" ON school_features;'
    ];
    
    for (const stmt of dropStatements) {
      await executeSQL(stmt, 'Dropping policy');
    }
    
    console.log('\n2. Creating new policies...');
    
    const createStatements = [
      `CREATE POLICY "school_features_public_read" ON school_features
        FOR SELECT TO anon, authenticated
        USING (true);`,
      `CREATE POLICY "school_features_authenticated_all" ON school_features
        FOR ALL TO authenticated
        USING (true)
        WITH CHECK (true);`
    ];
    
    for (const stmt of createStatements) {
      await executeSQL(stmt, 'Creating policy');
    }
    
    console.log('\n3. Granting permissions...');
    
    const grantStatements = [
      'GRANT SELECT ON school_features TO anon;',
      'GRANT ALL ON school_features TO authenticated;',
      'GRANT USAGE, SELECT ON SEQUENCE school_features_id_seq TO authenticated;',
      'GRANT USAGE, SELECT ON SEQUENCE school_features_id_seq TO anon;'
    ];
    
    for (const stmt of grantStatements) {
      await executeSQL(stmt, 'Granting permission');
    }
    
    // Step 3: Test the fix
    console.log('\n4. Testing the final fix...');
    
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
      feature_title: 'Final Fix Test',
      feature_description: 'Testing the final RLS fix',
      icon_name: 'final-icon',
      is_active: true,
      display_order: 995
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('school_features')
      .insert(testFeature)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ INSERT still failed:', insertError.message);
      console.error('   Error code:', insertError.code);
      
      console.log('\n   Manual SQL execution may be required.');
      console.log('   Please run the following SQL in Supabase SQL Editor:');
      console.log('   ' + fixSQL.replace(/\n/g, '\n   '));
      
    } else {
      console.log('🎉 INSERT successful! Created feature with ID:', insertData.id);
      
      // Test UPDATE
      const { data: updateData, error: updateError } = await supabase
        .from('school_features')
        .update({ feature_title: 'Updated Final Test' })
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
    
    // Test public access
    console.log('\n5. Testing public access...');
    const { data: publicData, error: publicError } = await supabase
      .from('school_features')
      .select('*');
    
    if (publicError) {
      console.error('❌ Public access failed:', publicError.message);
    } else {
      console.log(`✅ Public access successful - found ${publicData.length} features`);
    }
    
    console.log('\n🎯 Final RLS fix completed!');
    console.log('\nIf the fix was successful, the School Features Manager should now work properly.');
    
  } catch (error) {
    console.error('❌ Final fix failed:', error.message);
  }
}

finalRLSFix();