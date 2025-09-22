import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function testFormSubmission() {
  console.log('\n=== Testing Form Submission (Anonymous User) ===');
  
  try {
    // Test reading admission_forms to check if forms are active
    console.log('1. Testing anonymous read access to admission_forms...');
    const { data: forms, error: readError } = await anonClient
      .from('admission_forms')
      .select('*');
    
    if (readError) {
      console.log('❌ Cannot read admission_forms:', readError.message);
      return false;
    }
    console.log('✅ Can read admission_forms:', forms);
    
    // Test submitting a KG STD application
    console.log('\n2. Testing KG STD form submission...');
    const kgStdData = {
      application_number: 'KG' + Date.now(),
      full_name: 'Test Child',
      date_of_birth: '2018-01-01',
      gender: 'Male',
      father_name: 'Test Father',
      mother_name: 'Test Mother',
      house_name: 'Test House',
      village: 'Test Village',
      post_office: 'Test PO',
      district: 'Test District',
      pincode: '123456',
      mobile_number: '9876543210',
      email: 'test@example.com',
      previous_school: 'Test School'
    };
    const { data: kgSubmission, error: kgError } = await anonClient
      .from('kg_std_applications')
      .insert(kgStdData)
      .select();
    
    if (kgError) {
      console.log('❌ Cannot submit KG STD form:', kgError.message);
      return false;
    }
    console.log('✅ KG STD form submitted successfully:', kgSubmission);
    
    // Test submitting a Plus One application
    console.log('\n3. Testing Plus One form submission...');
    const plusOneData = {
      application_number: 'PO' + Date.now(),
      full_name: 'Test Student',
      date_of_birth: '2005-01-01',
      gender: 'Female',
      father_name: 'Test Father',
      mother_name: 'Test Mother',
      house_name: 'Test House',
      village: 'Test Village',
      post_office: 'Test PO',
      district: 'Test District',
      pincode: '123456',
      mobile_number: '9876543210',
      email: 'test@example.com',
      tenth_school: 'Test High School',
      board: 'State Board',
      exam_year: '2023',
      exam_roll_number: 'TEST123',
      stream: 'Science'
    };
    const { data: plusOneSubmission, error: plusOneError } = await anonClient
      .from('plus_one_applications')
      .insert(plusOneData)
      .select();
    
    if (plusOneError) {
      console.log('❌ Cannot submit Plus One form:', plusOneError.message);
      return false;
    }
    console.log('✅ Plus One form submitted successfully:', plusOneSubmission);
    
    return true;
  } catch (error) {
    console.log('❌ Form submission test failed:', error.message);
    return false;
  }
}

async function testManagementToggle() {
  console.log('\n=== Testing Management Toggle (Admin User) ===');
  
  try {
    // First, sign in as admin
    console.log('1. Signing in as admin...');
    const { data: authData, error: authError } = await serviceClient.auth.signInWithPassword({
      email: 'admin@potturschool.com',
      password: 'admin123'
    });
    
    if (authError) {
      console.log('❌ Admin sign-in failed:', authError.message);
      console.log('Trying with service role key for admin operations...');
    }
    
    // Test reading admission_forms as admin
    console.log('\n2. Testing admin read access to admission_forms...');
    const { data: forms, error: readError } = await serviceClient
      .from('admission_forms')
      .select('*');
    
    if (readError) {
      console.log('❌ Admin cannot read admission_forms:', readError.message);
      return false;
    }
    console.log('✅ Admin can read admission_forms:', forms);
    
    // Test updating form status
    console.log('\n3. Testing form status update...');
    const kgForm = forms.find(f => f.form_type === 'kg_std');
    if (!kgForm) {
      console.log('❌ No KG STD form found to update');
      return false;
    }
    
    const newStatus = !kgForm.is_active;
    const { data: updateData, error: updateError } = await serviceClient
      .from('admission_forms')
      .update({ is_active: newStatus })
      .eq('form_type', 'kg_std')
      .select();
    
    if (updateError) {
      console.log('❌ Cannot update form status:', updateError.message);
      return false;
    }
    console.log('✅ Form status updated successfully:', updateData);
    
    // Verify the update
    console.log('\n4. Verifying form status update...');
    const { data: verifyData, error: verifyError } = await serviceClient
      .from('admission_forms')
      .select('*')
      .eq('form_type', 'kg_std');
    
    if (verifyError) {
      console.log('❌ Cannot verify update:', verifyError.message);
      return false;
    }
    
    const updatedForm = verifyData[0];
    if (updatedForm.is_active === newStatus) {
      console.log('✅ Form status update verified:', updatedForm);
      return true;
    } else {
      console.log('❌ Form status not updated properly:', updatedForm);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Management toggle test failed:', error.message);
    return false;
  }
}

async function testConflictScenario() {
  console.log('\n=== Testing Conflict Scenario ===');
  
  // Test both functionalities in sequence
  const submissionWorks = await testFormSubmission();
  const managementWorks = await testManagementToggle();
  
  console.log('\n=== Results Summary ===');
  console.log('Form Submission Works:', submissionWorks ? '✅' : '❌');
  console.log('Management Toggle Works:', managementWorks ? '✅' : '❌');
  
  if (submissionWorks && managementWorks) {
    console.log('\n🎉 Both functionalities work - no conflict detected!');
  } else if (!submissionWorks && !managementWorks) {
    console.log('\n💥 Both functionalities broken - system-wide issue!');
  } else {
    console.log('\n⚠️  Conflict confirmed - only one functionality works at a time!');
  }
  
  // Test if enabling one breaks the other
  if (submissionWorks && managementWorks) {
    console.log('\n=== Testing Sequential Operations ===');
    
    // Try submission after management operation
    console.log('Testing submission after management toggle...');
    const submissionAfterManagement = await testFormSubmission();
    
    // Try management after submission operation
    console.log('Testing management after form submission...');
    const managementAfterSubmission = await testManagementToggle();
    
    console.log('\nSequential Test Results:');
    console.log('Submission after Management:', submissionAfterManagement ? '✅' : '❌');
    console.log('Management after Submission:', managementAfterSubmission ? '✅' : '❌');
  }
}

// Run the conflict analysis
testConflictScenario().catch(console.error);