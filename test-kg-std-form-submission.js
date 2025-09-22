import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testKGStdFormSubmission() {
  console.log('Testing KG STD form submission...');
  
  const testData = {
    application_number: 'TEST-KG-' + Date.now(),
    full_name: 'Test Student',
    date_of_birth: '2018-05-15',
    gender: 'male',
    father_name: 'Test Father',
    mother_name: 'Test Mother',
    guardian_name: 'Test Guardian',
    house_name: 'Test House',
    village: 'Test Village',
    post_office: 'Test PO',
    district: 'Ernakulam',
    pincode: '123456',
    mobile_number: '9876543210',
    email: 'test@example.com',
    previous_school: 'ABC Kindergarten',
    status: 'submitted'
  };

  try {
    const { data, error } = await supabase
      .from('kg_std_applications')
      .insert([testData])
      .select();

    if (error) {
      console.error('❌ Form submission failed:', error.message);
      console.error('Error details:', error);
      return false;
    }

    console.log('✅ Form submission successful!');
    console.log('Inserted data:', data);
    return true;
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    return false;
  }
}

async function testFormSettings() {
  console.log('\nTesting form settings access...');
  
  try {
    const { data, error } = await supabase
      .from('form_settings')
      .select('*')
      .eq('form_type', 'kg_std');

    if (error) {
      console.error('❌ Form settings access failed:', error.message);
      return false;
    }

    console.log('✅ Form settings accessible!');
    console.log('Form settings:', data);
    return true;
  } catch (err) {
    console.error('❌ Unexpected error accessing form settings:', err.message);
    return false;
  }
}

async function runTests() {
  console.log('=== KG STD Form Testing ===\n');
  
  const formSettingsTest = await testFormSettings();
  const formSubmissionTest = await testKGStdFormSubmission();
  
  console.log('\n=== Test Results ===');
  console.log(`Form Settings Access: ${formSettingsTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Form Submission: ${formSubmissionTest ? '✅ PASS' : '❌ FAIL'}`);
  
  if (formSettingsTest && formSubmissionTest) {
    console.log('\n🎉 All tests passed! KG STD form is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
}

runTests().catch(console.error);