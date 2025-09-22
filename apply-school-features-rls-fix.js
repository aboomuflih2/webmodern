import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySchoolFeaturesRLSFix() {
  console.log('\n=== Applying School Features RLS Fix ===');
  
  try {
    // Step 1: Test current table access
    console.log('\n1. Testing current table access...');
    
    const { data: currentData, error: selectError } = await supabase
      .from('school_features')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.error('❌ Cannot access school_features table:', selectError.message);
      return;
    }
    
    console.log('✅ Can access school_features table');
    console.log('   Current records count:', currentData?.length || 0);
    
    // Step 2: Test is_admin() function
    console.log('\n2. Testing is_admin() function...');
    const { data: adminTest, error: adminTestError } = await supabase.rpc('is_admin');
    
    if (adminTestError) {
      console.error('❌ is_admin() function test failed:', adminTestError.message);
      console.log('   The function might not exist or have issues');
    } else {
      console.log('✅ is_admin() function result:', adminTest);
    }
    
    // Step 3: Test INSERT operation with service role
    console.log('\n3. Testing INSERT with service role...');
    
    const testFeature = {
      feature_title: 'RLS Test Feature',
      feature_description: 'Testing RLS policies',
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
      console.error('❌ INSERT failed with service role:', insertError.message);
      console.error('   Error code:', insertError.code);
      
      // This suggests RLS policies are blocking even service role
      console.log('\n   🔧 RLS policies need to be fixed manually in Supabase SQL Editor');
      console.log('   Please run the following SQL commands:');
      console.log('');
      console.log('   -- 1. Drop existing policies');
      console.log('   DROP POLICY IF EXISTS "Allow public read access to school_features" ON school_features;');
      console.log('   DROP POLICY IF EXISTS "Allow admin full access to school_features" ON school_features;');
      console.log('');
      console.log('   -- 2. Create new policies');
      console.log('   CREATE POLICY "Allow public read access to school_features" ON school_features');
      console.log('     FOR SELECT TO anon, authenticated');
      console.log('     USING (true);');
      console.log('');
      console.log('   CREATE POLICY "Allow admin full access to school_features" ON school_features');
      console.log('     FOR ALL TO authenticated');
      console.log('     USING (is_admin())');
      console.log('     WITH CHECK (is_admin());');
      console.log('');
      console.log('   -- 3. Grant permissions');
      console.log('   GRANT SELECT ON school_features TO anon;');
      console.log('   GRANT ALL ON school_features TO authenticated;');
      
    } else {
      console.log('✅ INSERT successful! Created feature with ID:', insertData.id);
      
      // Clean up test data
      const { error: deleteError } = await supabase
        .from('school_features')
        .delete()
        .eq('id', insertData.id);
      
      if (deleteError) {
        console.log('⚠️  Could not clean up test data:', deleteError.message);
      } else {
        console.log('✅ Cleaned up test data');
      }
    }
    
    // Step 4: Test with anon access (simulating frontend)
    console.log('\n4. Testing with anon access (frontend simulation)...');
    
    const anonClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY || '');
    
    const { data: anonData, error: anonError } = await anonClient
      .from('school_features')
      .select('*')
      .limit(1);
    
    if (anonError) {
      console.error('❌ Anon access failed:', anonError.message);
    } else {
      console.log('✅ Anon can read school_features');
    }
    
    // Test anon insert (should fail)
    const { error: anonInsertError } = await anonClient
      .from('school_features')
      .insert({
        feature_title: 'Anon Test',
        feature_description: 'Should fail',
        icon_name: 'test'
      });
    
    if (anonInsertError) {
      console.log('✅ Anon INSERT correctly blocked:', anonInsertError.message);
    } else {
      console.log('⚠️  Anon INSERT should have been blocked but succeeded');
    }
    
    console.log('\n=== RLS Analysis Complete ===');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the fix
applySchoolFeaturesRLSFix().then(() => {
  console.log('\nScript completed.');
}).catch(error => {
  console.error('Script failed:', error);
});