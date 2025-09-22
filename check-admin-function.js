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

async function checkAdminFunction() {
  try {
    console.log('🔍 Checking admin function and RLS policies...');
    
    // Check if is_admin function exists
    console.log('\n1. Checking if is_admin() function exists...');
    const { data: functions, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_definition')
      .eq('routine_name', 'is_admin')
      .eq('routine_schema', 'public');
    
    if (funcError) {
      console.error('❌ Error checking functions:', funcError.message);
    } else if (functions && functions.length > 0) {
      console.log('✅ is_admin() function exists');
      console.log('   Definition:', functions[0].routine_definition);
    } else {
      console.log('❌ is_admin() function does NOT exist');
      console.log('   This is likely the cause of the RLS policy failure');
    }
    
    // Check current policies on school_features table
    console.log('\n2. Checking current RLS policies on school_features...');
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('policyname, qual, with_check')
      .eq('tablename', 'school_features');
    
    if (policyError) {
      console.error('❌ Error checking policies:', policyError.message);
    } else {
      console.log(`✅ Found ${policies.length} policies on school_features:`);
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}`);
        console.log(`     Condition: ${policy.qual}`);
        if (policy.with_check) {
          console.log(`     With Check: ${policy.with_check}`);
        }
      });
    }
    
    // Check if user has admin role in their JWT
    console.log('\n3. Testing admin authentication...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@pottur.school',
      password: 'admin123'
    });
    
    if (authError) {
      console.error('❌ Admin login failed:', authError.message);
    } else {
      console.log('✅ Admin login successful');
      
      // Get the current user's JWT payload
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('   User ID:', user.id);
        console.log('   User email:', user.email);
        console.log('   User metadata:', user.user_metadata);
        console.log('   App metadata:', user.app_metadata);
      }
      
      await supabase.auth.signOut();
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkAdminFunction();