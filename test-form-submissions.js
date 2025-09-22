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

// Test data for KG STD application
const kgStdTestData = {
  full_name: 'Test Child KG',
  date_of_birth: '2019-05-15',
  gender: 'male',
  father_name: 'Test Father',
  mother_name: 'Test Mother',
  guardian_phone: '9876543210',
  guardian_email: 'test@example.com',
  address: '123 Test Street, Test City',
  previous_school: 'Test Kindergarten',
  medical_conditions: 'None',
  emergency_contact: '9876543211',
  application_number: 'KG' + Date.now(),
  status: 'submitted'
};

// Test data for Plus One application
const plusOneTestData = {
  full_name: 'Test Student Plus One',
  date_of_birth: '2006-08-20',
  gender: 'female',
  father_name: 'Test Father Plus',
  mother_name: 'Test Mother Plus',
  guardian_phone: '9876543212',
  guardian_email: 'testplus@example.com',
  address: '456 Test Avenue, Test City',
  previous_school: 'Test High School',
  tenth_percentage: 85.5,
  preferred_stream: 'science',
  subjects: ['physics', 'chemistry', 'mathematics'],
  application_number: 'PO' + Date.now(),
  status: 'submitted'
};

async function testKGStdSubmission() {
  console.log('\n=== Testing KG STD Form Submission ===');
  
  try {
    const { data, error } = await supabase
      .from('kg_std_applications')
      .insert([kgStdTestData])
      .select();
    
    if (error) {
      console.error('❌ KG STD submission failed:', error.message);
      return false;
    }
    
    console.log('✅ KG STD submission successful:', data[0]?.id);
    return true;
  } catch (err) {
    console.error('❌ KG STD submission error:', err.message);
    return false;
  }
}

async function testPlusOneSubmission() {
  console.log('\n=== Testing Plus One Form Submission ===');
  
  try {
    const { data, error } = await supabase
      .from('plus_one_applications')
      .insert([plusOneTestData])
      .select();
    
    if (error) {
      console.error('❌ Plus One submission failed:', error.message);
      return false;
    }
    
    console.log('✅ Plus One submission successful:', data[0]?.id);
    return true;
  } catch (err) {
    console.error('❌ Plus One submission error:', err.message);
    return false;
  }
}

async function testDatabaseConnection() {
  console.log('\n=== Testing Database Connection ===');
  
  try {
    const { data, error } = await supabase
      .from('kg_std_applications')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    return false;
  }
}

async function testRLSPolicies() {
  console.log('\n=== Testing RLS Policies ===');
  
  try {
    // Test anonymous read access
    const { data: kgData, error: kgError } = await supabase
      .from('kg_std_applications')
      .select('id')
      .limit(1);
    
    const { data: plusData, error: plusError } = await supabase
      .from('plus_one_applications')
      .select('id')
      .limit(1);
    
    if (kgError && kgError.code === 'PGRST301') {
      console.error('❌ KG STD table access denied - RLS policy issue');
      return false;
    }
    
    if (plusError && plusError.code === 'PGRST301') {
      console.error('❌ Plus One table access denied - RLS policy issue');
      return false;
    }
    
    console.log('✅ RLS policies working correctly');
    return true;
  } catch (err) {
    console.error('❌ RLS policy test error:', err.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Form Management Tests...');
  
  const results = {
    dbConnection: await testDatabaseConnection(),
    rlsPolicies: await testRLSPolicies(),
    kgStdSubmission: await testKGStdSubmission(),
    plusOneSubmission: await testPlusOneSubmission()
  };
  
  console.log('\n=== Test Results Summary ===');
  console.log('Database Connection:', results.dbConnection ? '✅ PASS' : '❌ FAIL');
  console.log('RLS Policies:', results.rlsPolicies ? '✅ PASS' : '❌ FAIL');
  console.log('KG STD Submission:', results.kgStdSubmission ? '✅ PASS' : '❌ FAIL');
  console.log('Plus One Submission:', results.plusOneSubmission ? '✅ PASS' : '❌ FAIL');
  
  const allPassed = Object.values(results).every(result => result);
  console.log('\n🎯 Overall Status:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  if (!allPassed) {
    console.log('\n💡 Recommendation: Check Supabase RLS policies and table permissions');
  }
  
  process.exit(allPassed ? 0 : 1);
}

runAllTests();