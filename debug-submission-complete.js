import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54323';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugJobApplicationSubmission() {
  console.log('🔍 Starting comprehensive job application submission debug...');
  
  try {
    // Step 1: Test Supabase connection
    console.log('\n1️⃣ Testing Supabase connection...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('job_applications')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Supabase connection failed:', healthError);
      return;
    }
    console.log('✅ Supabase connection successful');
    
    // Step 2: Check job_applications table structure
    console.log('\n2️⃣ Checking job_applications table structure...');
    const { data: tableData, error: tableError } = await supabase
      .from('job_applications')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table access error:', tableError);
    } else {
      console.log('✅ Table accessible, sample data:', tableData);
    }
    
    // Step 3: Test CV upload to storage
    console.log('\n3️⃣ Testing CV upload to storage...');
    
    // Create a test file
    const testFileName = `test-cv-${Date.now()}.txt`;
    const testFileContent = 'This is a test CV file for debugging purposes.';
    const testFilePath = path.join(__dirname, testFileName);
    
    // Write test file
    fs.writeFileSync(testFilePath, testFileContent);
    console.log(`📄 Created test file: ${testFileName}`);
    
    // Upload to Supabase storage
    const fileBuffer = fs.readFileSync(testFilePath);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cv-uploads')
      .upload(testFileName, fileBuffer, {
        contentType: 'text/plain',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ CV upload failed:', uploadError);
    } else {
      console.log('✅ CV upload successful:', uploadData);
    }
    
    // Step 4: Test job application data insertion
    console.log('\n4️⃣ Testing job application data insertion...');
    
    const testApplicationData = {
      full_name: 'Test User Debug',
      email: 'test.debug@example.com',
      phone: '+1234567890',
      designation: 'Software Developer',
      cv_file_path: uploadData?.path || testFileName
    };
    
    console.log('📝 Attempting to insert:', testApplicationData);
    
    const { data: insertData, error: insertError } = await supabase
      .from('job_applications')
      .insert([testApplicationData])
      .select();
    
    if (insertError) {
      console.error('❌ Data insertion failed:', insertError);
      console.error('Error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
    } else {
      console.log('✅ Data insertion successful:', insertData);
    }
    
    // Step 5: Test RLS policies
    console.log('\n5️⃣ Testing RLS policies...');
    
    // Try to read the inserted data
    const { data: readData, error: readError } = await supabase
      .from('job_applications')
      .select('*')
      .eq('email', 'test.debug@example.com');
    
    if (readError) {
      console.error('❌ Data read failed (RLS issue?):', readError);
    } else {
      console.log('✅ Data read successful:', readData);
    }
    
    // Step 6: Cleanup
    console.log('\n6️⃣ Cleaning up test data...');
    
    // Delete from storage
    if (uploadData?.path) {
      const { error: deleteStorageError } = await supabase.storage
        .from('cv-uploads')
        .remove([uploadData.path]);
      
      if (deleteStorageError) {
        console.error('⚠️ Storage cleanup failed:', deleteStorageError);
      } else {
        console.log('✅ Storage cleanup successful');
      }
    }
    
    // Delete from database
    if (insertData && insertData.length > 0) {
      const { error: deleteDbError } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', insertData[0].id);
      
      if (deleteDbError) {
        console.error('⚠️ Database cleanup failed:', deleteDbError);
      } else {
        console.log('✅ Database cleanup successful');
      }
    }
    
    // Delete local test file
    try {
      fs.unlinkSync(testFilePath);
      console.log('✅ Local file cleanup successful');
    } catch (err) {
      console.error('⚠️ Local file cleanup failed:', err.message);
    }
    
    console.log('\n🎉 Debug process completed!');
    
  } catch (error) {
    console.error('💥 Unexpected error during debug:', error);
  }
}

// Run the debug function
debugJobApplicationSubmission().catch(console.error);