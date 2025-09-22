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

async function testAdminAuth() {
  try {
    console.log('🧪 Testing admin authentication and permissions...');
    
    // Step 1: Check current auth state
    console.log('\n👤 Step 1: Checking current auth state...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Error getting user:', userError);
    }
    
    console.log('Current user:', user ? `${user.email} (${user.id})` : 'Not authenticated');
    
    // Step 2: Try to sign in as admin
    console.log('\n🔐 Step 2: Attempting to sign in as admin...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@modernhss.edu.in',
      password: 'admin123'
    });
    
    if (signInError) {
      console.error('❌ Sign in failed:', signInError);
      return;
    }
    
    console.log('✅ Signed in successfully as:', signInData.user?.email);
    
    // Step 3: Test is_admin() function
    console.log('\n🔍 Step 3: Testing is_admin() function...');
    const { data: isAdminData, error: isAdminError } = await supabase
      .rpc('is_admin');
    
    if (isAdminError) {
      console.error('❌ Error calling is_admin():', isAdminError);
    } else {
      console.log('is_admin() result:', isAdminData);
    }
    
    // Step 4: Check user_roles table
    console.log('\n📋 Step 4: Checking user_roles table...');
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', signInData.user?.id);
    
    if (rolesError) {
      console.error('❌ Error checking user roles:', rolesError);
    } else {
      console.log('User roles:', rolesData);
    }
    
    // Step 5: Test admission_forms update as authenticated admin
    console.log('\n🔄 Step 5: Testing admission_forms update as authenticated admin...');
    
    // First, get current forms
    const { data: currentForms, error: fetchError } = await supabase
      .from('admission_forms')
      .select('*');
    
    if (fetchError) {
      console.error('❌ Error fetching forms:', fetchError);
      return;
    }
    
    console.log('Current forms:', currentForms);
    
    // Try to update a form
    const kgStdForm = currentForms?.find(f => f.form_type === 'kg_std');
    if (kgStdForm) {
      const newStatus = !kgStdForm.is_active;
      console.log(`Attempting to update KG STD status from ${kgStdForm.is_active} to ${newStatus}`);
      
      const { data: updateData, error: updateError } = await supabase
        .from('admission_forms')
        .update({ is_active: newStatus })
        .eq('form_type', 'kg_std')
        .select();
      
      if (updateError) {
        console.error('❌ Error updating form as admin:', updateError);
      } else {
        console.log('✅ Form updated successfully as admin:', updateData);
        
        // Verify the change
        const { data: verifyData, error: verifyError } = await supabase
          .from('admission_forms')
          .select('*')
          .eq('form_type', 'kg_std');
        
        if (verifyError) {
          console.error('❌ Error verifying update:', verifyError);
        } else {
          console.log('Verified updated form:', verifyData);
        }
      }
    }
    
    console.log('\n🎉 Admin authentication test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAdminAuth();