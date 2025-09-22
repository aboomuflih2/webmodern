import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

// Create clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function testToggleFunctionality() {
  console.log('🧪 Testing Toggle Functionality...');
  
  try {
    // Step 1: Check current state of admission_forms table
    console.log('\n1. Checking current admission forms state...');
    const { data: initialForms, error: fetchError } = await supabase
      .from('admission_forms')
      .select('*')
      .order('form_type');
    
    if (fetchError) {
      console.error('❌ Error fetching forms:', fetchError.message);
      return;
    }
    
    console.log('📋 Current forms state:', initialForms);
    
    // Step 2: Sign in as admin
    console.log('\n2. Signing in as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@modernhss.edu.in',
      password: 'admin123'
    });
    
    if (authError) {
      console.error('❌ Admin sign-in failed:', authError.message);
      return;
    }
    
    console.log('✅ Signed in as:', authData.user?.email);
    
    // Step 3: Test toggling KG STD form
    console.log('\n3. Testing KG STD form toggle...');
    const kgStdForm = initialForms?.find(f => f.form_type === 'kg_std');
    
    if (!kgStdForm) {
      console.error('❌ KG STD form not found in database');
      return;
    }
    
    const newKgStdStatus = !kgStdForm.is_active;
    console.log(`🔄 Toggling KG STD from ${kgStdForm.is_active} to ${newKgStdStatus}`);
    
    const { error: kgStdUpdateError } = await supabase
      .from('admission_forms')
      .update({ is_active: newKgStdStatus })
      .eq('form_type', 'kg_std');
    
    if (kgStdUpdateError) {
      console.error('❌ KG STD toggle failed:', kgStdUpdateError.message);
    } else {
      console.log('✅ KG STD toggle successful');
    }
    
    // Step 4: Verify KG STD change persisted
    console.log('\n4. Verifying KG STD change persistence...');
    const { data: kgStdVerify, error: kgStdVerifyError } = await supabase
      .from('admission_forms')
      .select('*')
      .eq('form_type', 'kg_std')
      .single