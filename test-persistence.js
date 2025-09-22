import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPersistence() {
  console.log('🧪 Testing toggle state persistence...');
  
  try {
    // 1. Sign in as admin
    console.log('\n🔐 Step 1: Signing in as admin...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@modernhss.edu.in',
      password: 'admin123'
    });

    if (signInError) {
      console.error('❌ Admin sign-in error:', signInError);
      return;
    }

    console.log('✅ Signed in successfully');

    // 2. Get initial state
    console.log('\n📋 Step 2: Getting initial state...');
    const { data: initialForms, error: initialError } = await supabase
      .from('admission_forms')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (initialError) {
      console.error('❌ Error fetching initial forms:', initialError);
      return;
    }

    const kgForm = initialForms.find(f => f.form_type === 'kg_std');
    const plusOneForm = initialForms.find(f => f.form_type === 'plus_one');
    
    console.log('Initial KG STD status:', kgForm.is_active);
    console.log('Initial Plus One status:', plusOneForm.is_active);

    // 3. Toggle KG STD form
    console.log('\n🔄 Step 3: Toggling KG STD form...');
    const newKgStatus = !kgForm.is_active;
    
    const { data: updateResult, error: updateError } = await supabase
      .from('admission_forms')
      .update({ is_active: newKgStatus })
      .eq('id', kgForm.id)
      .select();

    if (updateError) {
      console.error('❌ Update error:', updateError);
      return;
    }

    console.log('✅ KG STD toggled to:', newKgStatus);

    // 4. Simulate page refresh by creating a new client session
    console.log('\n🔄 Step 4: Simulating page refresh (new session)...');
    
    // Sign out and sign in again to simulate fresh page load
    await supabase.auth.signOut();
    
    const { data: refreshSignIn, error: refreshSignInError } = await supabase.auth.signInWithPassword({
      email: 'admin@modernhss.edu.in',
      password: 'admin123'
    });

    if (refreshSignInError) {
      console.error('❌ Refresh sign-in error:', refreshSignInError);
      return;
    }

    // 5. Check if state persisted
    console.log('\n🔍 Step 5: Checking if state persisted after refresh...');
    const { data: refreshedForms, error: refreshedError } = await supabase
      .from('admission_forms')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (refreshedError) {
      console.error('❌ Error fetching refreshed forms:', refreshedError);
      return;
    }

    const refreshedKgForm = refreshedForms.find(f => f.form_type === 'kg_std');
    const refreshedPlusOneForm = refreshedForms.find(f => f.form_type === 'plus_one');
    
    console.log('After refresh KG STD status:', refreshedKgForm.is_active);
    console.log('After refresh Plus One status:', refreshedPlusOneForm.is_active);

    // 6. Verify persistence
    if (refreshedKgForm.is_active === newKgStatus) {
      console.log('✅ SUCCESS: KG STD toggle state persisted after refresh!');
    } else {
      console.log('❌ FAILURE: KG STD toggle state did not persist after refresh!');
    }

    // 7. Revert to original state for cleanup
    console.log('\n🧹 Step 6: Cleaning up - reverting to original state...');
    const { data: revertResult, error: revertError } = await supabase
      .from('admission_forms')
      .update({ is_active: kgForm.is_active })
      .eq('id', kgForm.id)
      .select();

    if (revertError) {
      console.error('❌ Revert error:', revertError);
    } else {
      console.log('✅ Reverted to original state successfully');
    }

    console.log('\n🎉 Persistence test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPersistence();