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

// Create clients
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

async function testSchoolFeaturesRLS() {
  console.log('🔍 Testing School Features RLS Policies...');
  
  try {
    // 1. Check if RLS policies exist
    console.log('\n1. Checking RLS policies on school_features table...');
    const { data: policies, error: policiesError } = await serviceClient
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'school_features');
    
    if (policiesError) {
      console.error('❌ Error fetching policies:', policiesError);
    } else {
      console.log('✅ Found policies:', policies.map(p => p.policyname));
    }
    
    // 2. Test anonymous read access
    console.log('\n2. Testing anonymous read access...');
    const { data: anonData, error: anonError } = await anonClient
      .from('school_features')
      .select('*');
    
    if (anonError) {
      console.error('❌ Anonymous read failed:', anonError);
    } else {
      console.log('✅ Anonymous read successful, found', anonData.length, 'features');
    }
    
    // 3. Test admin authentication and operations
    console.log('\n3. Testing admin authentication...');
    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
      email: 'admin@modernhss.edu.in',
      password: 'admin123'
    });
    
    if (authError) {
      console.error('❌ Admin login failed:', authError);
      return;
    }
    
    console.log('✅ Admin login successful');
    
    // Create authenticated client
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`
        }
      }
    });
    
    // 4. Test admin CRUD operations
    console.log('\n4. Testing admin CRUD operations...');
    
    // Test INSERT
    const testFeature = {
      feature_title: 'Test Feature RLS',
      feature_description: 'Testing RLS policies',
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
    
    // 5. Test permissions
    console.log('\n5. Testing table permissions...');
    const { data: permData, error: permError } = await serviceClient
      .from('information_schema.role_table_grants')
      .select('*')
      .eq('table_schema', 'public')
      .eq('table_name', 'school_features')
      .in('grantee', ['anon', 'authenticated']);
    
    if (permError) {
      console.error('❌ Error checking permissions:', permError);
    } else {
      console.log('✅ Table permissions:');
      permData.forEach(perm => {
        console.log(`  - ${perm.grantee}: ${perm.privilege_type}`);
      });
    }
    
    // Cleanup - sign out
    await anonClient.auth.signOut();
    
    console.log('\n🎉 RLS testing completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testSchoolFeaturesRLS().catch(console.error);