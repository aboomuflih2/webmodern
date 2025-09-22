// Test script to debug job application form submission
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'http://127.0.0.1:54323';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'; // anon key for public access

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFormSubmission() {
  console.log('🧪 Testing Job Application Form Submission...');
  console.log('=' .repeat(50));

  try {
    // Test 1: Create a test PDF file
    console.log('\n1. Creating test CV file...');
    const testPdfContent = Buffer.from([
      0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, // %PDF-1.4
      0x0a, 0x25, 0xc4, 0xe5, 0xf2, 0xe5, 0xeb, 0xa7, // PDF header
      0xf3, 0xa0, 0xd0, 0xc4, 0xc6, 0x0a // more PDF bytes
    ]);
    
    const testFileName = `test-cv-${Date.now()}.pdf`;
    
    // Test 2: Upload CV file
    console.log('\n2. Testing CV upload...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cv-uploads')
      .upload(testFileName, testPdfContent, {
        contentType: 'application/pdf'
      });
    
    if (uploadError) {
      console.error('❌ File upload error:', uploadError.message);
      return false;
    }
    console.log('✅ File upload successful:', uploadData.path);
    
    // Test 3: Submit job application data
    console.log('\n3. Testing job application submission...');
    // Test application data (matching database schema)
    const applicationData = {
      full_name: 'Test Applicant',
      email: 'test@example.com',
      phone: '1234567890',
      designation: 'Teacher',
      subject: 'Mathematics',
      experience_years: 5,
      qualifications: 'B.Ed, M.Sc Mathematics',
      district: 'Test District',
      address: '123 Test Street, Test City',
      cv_file_path: testFileName,
      cover_letter: 'I am interested in this position.'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('job_applications')
      .insert([applicationData])
      .select();
    
    if (insertError) {
      console.error('❌ Application submission error:', insertError.message);
      console.error('Error details:', insertError);
      
      // Clean up uploaded file
      await supabase.storage
        .from('cv-uploads')
        .remove([testFileName]);
      
      return false;
    }
    
    console.log('✅ Application submitted successfully!');
    console.log('Application data:', insertData);
    
    // Test 4: Verify data was saved
    console.log('\n4. Verifying data was saved...');
    const { data: fetchData, error: fetchError } = await supabase
      .from('job_applications')
      .select('*')
      .eq('email', 'test@example.com')
      .single();
    
    if (fetchError) {
      console.error('❌ Data fetch error:', fetchError.message);
      return false;
    }
    
    console.log('✅ Data verification successful!');
    console.log('Fetched data:', fetchData);
    
    // Clean up test data
    console.log('\n5. Cleaning up test data...');
    await supabase
      .from('job_applications')
      .delete()
      .eq('email', 'test@example.com');
    
    await supabase.storage
      .from('cv-uploads')
      .remove([testFileName]);
    
    console.log('✅ Cleanup completed!');
    
    console.log('\n🎉 All tests passed! Form submission is working correctly.');
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

testFormSubmission().then(success => {
  if (success) {
    console.log('\n✅ Form submission test completed successfully!');
  } else {
    console.log('\n❌ Form submission test failed!');
  }
  process.exit(success ? 0 : 1);
});