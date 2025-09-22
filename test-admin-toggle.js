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

async function testAdminToggle() {
  try {
    console.log('🧪 Testing admin toggle functionality...');
    
    // Step 1: Sign in as admin
    console.log('\n🔐 Step 1: Signing in as admin...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@modernhss.edu.in',
      password: 'admin123'
    });
    
    if (signInError) {
      console.error('❌ Sign in failed:', signInError);
      return;
    }
    
    console.log('✅ Signed in successfully as:', signInData.user?.email);
    
    // Step 2: Test is_admin() function
    console.log('\n🔍 Step 2: Testing is_admin() function...');
    const { data: isAdminData, error: isAdminError } = await supabase
      .rpc('is_admin');
    
    if (isAdminError) {
      console.error('❌ Error calling is_admin():', isAdminError);
    } else {
      console.log('is_admin() result:', isAdminData);
    }
    
    // Step 3: Get current admission forms
    console.log('\n📋 Step 3: Getting current admission forms...');
    const { data: currentForms, error: fetchError } = await supabase
      .from('admission_forms')
      .select('*');
    
    if (fetchError) {
      console.error('❌ Error fetching forms:', fetchError);
      return;
    }
    
    console.log('Current forms:', currentForms);
    
    // Step 4: Test toggle functionality
    console.log('\n🔄 Step 4: Testing toggle functionality...');
    
    const kgStdForm = currentForms?.find(f => f.form_type === 'kg_std');
    if (kgStdForm) {
      const newStatus = !kgStdForm.is_active;
      console.log(`Attempting to toggle KG STD status from ${kgStdForm.is_active} to ${newStatus}`);
      
      // Test the exact same update query as in the frontend
      const { data: updateData, error: updateError } = await supabase
        .from('admission_forms')
        .update({ 
          is_active: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('form_type', 'kg_std')
        .select();
      
      if (updateError) {
        console.error('❌ Error updating form as admin:', updateError);
        
        // Check if it's a permission issue
        if (updateError.code === '42501') {
          console.log('\n🔍 Permission denied - checking RLS policies...');
          
          // Check current policies
          const { data: policies, error: policyError } = await supabase
            .from('pg_policies')
            .select('*')
            .eq('tablename', 'admission_forms');
          
          if (policyError) {
            console.error('❌ Error checking policies:', policyError);
          } else {
            console.log('Current RLS policies:', policies);
          }
        }
      } else {
        console.log('✅ Form updated successfully as admin:', updateData);
        
        // Verify the change persisted
        const { data: verifyData, error: verifyError } = await supabase
          .from('admission_forms')
          .select('*')
          .eq('form_type', 'kg_std');
        
        if (verifyError) {
          console.error('❌ Error verifying update:', verifyError);
        } else {
          console.log('Verified updated form:', verifyData);
          
          // Toggle back to original state
          console.log('\n🔄 Toggling back to original state...');
          const { data: revertData, error: revertError } = await supabase
            .from('admission_forms')
            .update({ 
              is_active: kgStdForm.is_active,
              updated_at: new Date().toISOString()
            })
            .eq('form_type', 'kg_std')
            .select();
          
          if (revertError) {
            console.error('❌ Error reverting form:', revertError);
          } else {
            console.log('✅ Form reverted successfully:', revertData);
          }
        }
      }
    }
    
    console.log('\n🎉 Admin toggle test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAdminToggle();