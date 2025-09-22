import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkSchoolFeaturesPolicies() {
  console.log('\n=== Checking school_features table ===');
  
  try {
    // First, try to read existing data
    console.log('\n1. Testing SELECT operation...');
    const { data: selectData, error: selectError } = await supabase
      .from('school_features')
      .select('*')
      .limit(5);
    
    if (selectError) {
      console.error('SELECT failed:', selectError);
    } else {
      console.log('SELECT successful. Found', selectData.length, 'records');
      if (selectData.length > 0) {
        console.log('Sample record:', selectData[0]);
      }
    }
    
    // Test insert operation with service role
    console.log('\n2. Testing INSERT operation with service role...');
    const { data: insertTest, error: insertError } = await supabase
      .from('school_features')
      .insert({
        feature_title: 'Test Feature - Service Role',
        feature_description: 'Test Description from Service Role',
        icon_name: 'test-icon'
      })
      .select();
    
    if (insertError) {
      console.error('INSERT with service role failed:', insertError);
    } else {
      console.log('INSERT with service role successful:', insertTest);
      
      // Clean up test record
      if (insertTest && insertTest.length > 0) {
        const { error: deleteError } = await supabase
          .from('school_features')
          .delete()
          .eq('id', insertTest[0].id);
        
        if (deleteError) {
          console.error('Failed to clean up test record:', deleteError);
        } else {
          console.log('Test record cleaned up successfully');
        }
      }
    }
    
    // Now test with anon key (simulating frontend)
    console.log('\n3. Testing with anon key (frontend simulation)...');
    const anonSupabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    const { data: anonSelect, error: anonSelectError } = await anonSupabase
      .from('school_features')
      .select('*')
      .limit(1);
    
    if (anonSelectError) {
      console.error('Anon SELECT failed:', anonSelectError);
    } else {
      console.log('Anon SELECT successful');
    }
    
    const { data: anonInsert, error: anonInsertError } = await anonSupabase
      .from('school_features')
      .insert({
        feature_title: 'Test Feature - Anon',
        feature_description: 'Test Description from Anon',
        icon_name: 'test-icon-anon'
      })
      .select();
    
    if (anonInsertError) {
      console.error('Anon INSERT failed:', anonInsertError);
    } else {
      console.log('Anon INSERT successful:', anonInsert);
      
      // Clean up
      if (anonInsert && anonInsert.length > 0) {
        await supabase
          .from('school_features')
          .delete()
          .eq('id', anonInsert[0].id);
        console.log('Anon test record cleaned up');
      }
    }
    
    // Test authenticated user simulation
    console.log('\n4. Testing authenticated user simulation...');
    
    // First sign in as admin
    const { data: authData, error: authError } = await anonSupabase.auth.signInWithPassword({
      email: 'admin@pottur.school',
      password: 'admin123'
    });
    
    if (authError) {
      console.error('Auth failed:', authError);
    } else {
      console.log('Auth successful for:', authData.user?.email);
      
      // Test insert as authenticated user
      const { data: authInsert, error: authInsertError } = await anonSupabase
        .from('school_features')
        .insert({
          feature_title: 'Test Feature - Authenticated',
          feature_description: 'Test Description from Authenticated User',
          icon_name: 'test-icon-auth'
        })
        .select();
      
      if (authInsertError) {
        console.error('Authenticated INSERT failed:', authInsertError);
      } else {
        console.log('Authenticated INSERT successful:', authInsert);
        
        // Clean up
        if (authInsert && authInsert.length > 0) {
          await anonSupabase
            .from('school_features')
            .delete()
            .eq('id', authInsert[0].id);
          console.log('Authenticated test record cleaned up');
        }
      }
      
      // Sign out
      await anonSupabase.auth.signOut();
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkSchoolFeaturesPolicies();