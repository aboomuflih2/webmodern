import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testJobApplicationsSetup() {
  console.log('🧪 Testing Job Applications Setup...');
  console.log('=' .repeat(50));

  try {
    // Test 1: Check if job_applications table exists
    console.log('\n1. Checking job_applications table...');
    const { data: tableData, error: tableError } = await supabase
      .from('job_applications')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ job_applications table error:', tableError.message);
      return false;
    }
    console.log('✅ job_applications table exists and accessible');

    // Test 2: Check storage bucket
    console.log('\n2. Checking cv-uploads storage bucket...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Storage bucket error:', bucketError.message);
      return false;
    }
    
    const cvBucket = buckets.find(bucket => bucket.name === 'cv-uploads');
    if (!cvBucket) {
      console.error('❌ cv-uploads bucket not found');
      return false;
    }
    console.log('✅ cv-uploads storage bucket exists');

    // Test 3: Test file upload
    console.log('\n3. Testing file upload to cv-uploads bucket...');
    const testFileName = `test-cv-${Date.now()}.pdf`;
    // Create a minimal PDF-like content for testing
    const testFileContent = new Uint8Array([
      0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, // %PDF-1.4
      0x0a, 0x25, 0xc4, 0xe5, 0xf2, 0xe5, 0xeb, 0xa7, // PDF header
      0xf3, 0xa0, 0xd0, 0xc4, 0xc6, 0x0a // more PDF bytes
    ]);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cv-uploads')
      .upload(testFileName, testFileContent, {
        contentType: 'application/pdf'
      });
    
    if (uploadError) {
      console.error('❌ File upload error:', uploadError.message);
      return false;
    }
    console.log('✅ File upload successful:', uploadData.path);

    // Test 4: Insert test job application
    console.log('\n4. Testing job application data insertion...');
    const testApplication = {
      full_name: 'Test Applicant',
      email: 'test@example.com',
      phone: '1234567890',
      designation: 'Test Teacher',
      subject: 'Mathematics',
      experience_years: 5,
      qualifications: 'Bachelor\'s Degree in Mathematics',
      district: 'Test District',
      address: '123 Test Street, Test City',
      cv_file_path: uploadData.path,
      cover_letter: 'This is a test cover letter.'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('job_applications')
      .insert([testApplication])
      .select();
    
    if (insertError) {
      console.error('❌ Data insertion error:', insertError.message);
      return false;
    }
    console.log('✅ Job application data inserted successfully');
    console.log('   Application ID:', insertData[0].id);

    // Test 5: Verify data retrieval
    console.log('\n5. Testing data retrieval...');
    const { data: retrievedData, error: retrieveError } = await supabase
      .from('job_applications')
      .select('*')
      .eq('id', insertData[0].id)
      .single();
    
    if (retrieveError) {
      console.error('❌ Data retrieval error:', retrieveError.message);
      return false;
    }
    console.log('✅ Data retrieval successful');
    console.log('   Retrieved application:', {
      id: retrievedData.id,
      name: retrievedData.full_name,
      email: retrievedData.email,
      designation: retrievedData.designation,
      district: retrievedData.district
    });

    // Test 6: Test file download
    console.log('\n6. Testing file download...');
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('cv-uploads')
      .download(uploadData.path);
    
    if (downloadError) {
      console.error('❌ File download error:', downloadError.message);
      return false;
    }
    console.log('✅ File download successful');

    // Cleanup: Remove test data
    console.log('\n7. Cleaning up test data...');
    
    // Delete test application
    const { error: deleteAppError } = await supabase
      .from('job_applications')
      .delete()
      .eq('id', insertData[0].id);
    
    if (deleteAppError) {
      console.warn('⚠️  Could not delete test application:', deleteAppError.message);
    } else {
      console.log('✅ Test application deleted');
    }
    
    // Delete test file
    const { error: deleteFileError } = await supabase.storage
      .from('cv-uploads')
      .remove([uploadData.path]);
    
    if (deleteFileError) {
      console.warn('⚠️  Could not delete test file:', deleteFileError.message);
    } else {
      console.log('✅ Test file deleted');
    }

    console.log('\n🎉 All tests passed! Job application system is working correctly.');
    return true;

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
    return false;
  }
}

// Run the test
testJobApplicationsSetup()
  .then(success => {
    if (success) {
      console.log('\n✅ Job application system test completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Job application system test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });