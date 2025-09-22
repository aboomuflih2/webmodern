import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFormStatusUpdate() {
  try {
    console.log('🧪 Testing form status update functionality...');
    
    // Step 1: Try to sign in as admin
    console.log('\n1. Attempting admin login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@pottur.school',
      password: 'admin123'
    });
    
    if (authError) {
      console.log('❌ Admin login failed:', authError.message);
      console.log('   Trying alternative admin credentials...');
      
      const { data: authData2, error: authError2 } = await supabase.auth.signInWithPassword({
        email: 'web.modernhss@gmail.com',
        password: 'admin123'
      });
      
      if (authError2) {
        console.log('❌ Alternative admin login also failed:', authError2.message);
        console.log('   Proceeding without authentication to test RLS...');
      } else {
        console.log('✅ Admin login successful with alternative credentials');
        console.log('   User ID:', authData2.user?.id);
      }
    } else {
      console.log('✅ Admin login successful');
      console.log('   User ID:', authData.user?.id);
    }
    
    // Step 2: Check current admission forms
    console.log('\n2. Checking current admission forms...');
    const { data: forms, error: formsError } = await supabase
      .from('admission_forms')
      .select('*');
    
    if (formsError) {
      console.error('❌ Error fetching forms:', formsError.message);
      return;
    }
    
    console.log('✅ Current forms:', forms);
    
    // Step 3: Test is_admin() function
    console.log('\n3. Testing is_admin() function...');
    const { data: isAdminResult, error: isAdminError } = await supabase
      .rpc('is_admin');
    
    if (isAdminError) {
      console.error('❌ is_admin() function failed:', isAdminError.message);
    } else {
      console.log('✅ is_admin() result:', isAdminResult);
    }
    
    // Step 4: Try to update form status
    console.log('\n4. Attempting to update kg_std form status...');
    const { data: updateData, error: updateError } = await supabase
      .from('admission_forms')
      .update({ is_active: true })
      .eq('form_type', 'kg_std')
      .select();
    
    if (updateError) {
      console.error('❌ Form status update failed:', updateError.message);
      console.error('   Error details:', updateError);
    } else {
      console.log('✅ Form status update successful:', updateData);
    }
    
    // Step 5: Check user roles
    console.log('\n5. Checking user roles...');
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');
    
    if (rolesError) {
      console.error('❌ Error fetching user roles:', rolesError.message);
    } else {
      console.log('✅ User roles:', userRoles);
    }
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error.message);
  }
}

testFormStatusUpdate();