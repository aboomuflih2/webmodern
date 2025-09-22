import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Use anon key like the frontend does
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFrontendToggle() {
  console.log('🧪 Testing frontend toggle functionality...');
  
  try {
    // 1. Sign in as admin (like the frontend does)
    console.log('\n🔐 Step 1: Signing in as admin...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@modernhss.edu.in',
      password: 'admin123'
    });

    if (signInError) {
      console.error('❌ Admin sign-in error:', signInError);
      return;
    }

    console.log('✅ Signed in successfully as:', signInData.user.email);

    // 2. Get current admission forms (like the frontend does)
    console.log('\n📋 Step 2: Getting current admission forms...');
    const { data: forms, error: formsError } = await supabase
      .from('admission_forms')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (formsError) {
      console.error('❌ Error fetching forms:', formsError);
      return;
    }

    console.log('Current forms:', forms);
    
    const kgForm = forms.find(f => f.form_type === 'kg_std');
    if (!kgForm) {
      console.error('❌ KG STD form not found');
      return;
    }

    console.log('\n🎯 Found KG STD form:', kgForm);
    const originalStatus = kgForm.is_active;
    const newStatus = !originalStatus;

    // 3. Test the exact updateFormStatus function logic
    console.log(`\n🔄 Step 3: Testing toggle from ${originalStatus} to ${newStatus}...`);
    
    const { data: updateResult, error: updateError } = await supabase
      .from('admission_forms')
      .update({ is_active: newStatus })
      .eq('id', kgForm.id)
      .select();

    if (updateError) {
      console.error('❌ Update error:', updateError);
      return;
    }

    console.log('✅ Update result:', updateResult);

    // 4. Verify the change
    console.log('\n🔍 Step 4: Verifying the change...');
    const { data: verifyForm, error: verifyError } = await supabase
      .from('admission_forms')
      .select('*')
      .eq('id', kgForm.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Verification error:', verifyError);
      return;
    }

    console.log('Verified form:', verifyForm);
    
    if (verifyForm.is_active === newStatus) {
      console.log('✅ Toggle successful! Status changed correctly.');
    } else {
      console.log('❌ Toggle failed! Status did not change.');
    }

    // 5. Revert back to original state
    console.log('\n🔄 Step 5: Reverting to original state...');
    const { data: revertResult, error: revertError } = await supabase
      .from('admission_forms')
      .update({ is_active: originalStatus })
      .eq('id', kgForm.id)
      .select();

    if (revertError) {
      console.error('❌ Revert error:', revertError);
    } else {
      console.log('✅ Reverted successfully:', revertResult);
    }

    console.log('\n🎉 Frontend toggle test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFrontendToggle();