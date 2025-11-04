require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const adminSupabase = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

async function checkDatabaseSchema() {
  console.log('🔍 Checking job_applications table schema...\n');
  
  try {
    // Try to get table structure using information_schema
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'job_applications')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (error) {
      console.log('❌ Could not access information_schema, trying alternative method...');
      
      // Alternative: Try to insert empty data to see what columns exist
      const { error: insertError } = await supabase
        .from('job_applications')
        .insert([{}]);
      
      if (insertError) {
        console.log('Insert error details:', insertError);
        return false;
      }
    } else {
      console.log('✅ Current table columns:');
      data.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }
    
    return true;
  } catch (err) {
    console.error('❌ Schema check failed:', err);
    return false;
  }
}

async function checkFormFieldsMapping() {
  console.log('\n📝 Checking form fields vs database mapping...\n');
  
  const formFields = [
    'full_name',
    'email', 
    'phone',
    'date_of_birth',
    'address',
    'district',
    'designation',
    'subject',
    'other_designation',
    'qualifications',
    'experience_years',
    'previous_experience',
    'why_join'
  ];
  
  const expectedDbColumns = [
    'application_number',
    'full_name',
    'email',
    'phone',
    'position',
    'experience_years',
    'qualification',
    'cv_file',
    'cover_letter',
    'status',
    'applied_at',
    'reviewed_at',
    'reviewed_by',
    'interview_date',
    'interview_time',
    'notes',
    'created_at',
    'updated_at',
    // New columns that should be added
    'date_of_birth',
    'address',
    'district',
    'designation',
    'qualifications',
    'previous_experience',
    'why_join',
    'subject',
    'other_designation'
  ];
  
  console.log('Form fields:');
  formFields.forEach(field => console.log(`  - ${field}`));
  
  console.log('\nExpected database columns:');
  expectedDbColumns.forEach(col => console.log(`  - ${col}`));
  
  return true;
}

async function testStorageBucket() {
  console.log('\n🗂️ Testing storage bucket connection...\n');
  
  try {
    // Test bucket access
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Cannot list buckets:', bucketsError);
      return false;
    }
    
    console.log('✅ Available buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    
    // Test document-uploads bucket specifically
    const documentBucket = buckets.find(b => b.name === 'document-uploads');
    if (!documentBucket) {
      console.log('❌ document-uploads bucket not found');
      return false;
    }
    
    console.log('✅ document-uploads bucket exists');
    
    // Test file upload permissions
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = 'test content';
    
    const { error: uploadError } = await supabase.storage
      .from('document-uploads')
      .upload(testFileName, testContent);
    
    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError);
      return false;
    }
    
    console.log('✅ Upload test successful');
    
    // Clean up test file
    await supabase.storage
      .from('document-uploads')
      .remove([testFileName]);
    
    console.log('✅ Test file cleaned up');
    
    return true;
  } catch (err) {
    console.error('❌ Storage test failed:', err);
    return false;
  }
}

async function testRLSPolicies() {
  console.log('\n🔒 Testing RLS policies...\n');
  
  try {
    // Test if we can insert data
    const testData = {
      application_number: `TEST-${Date.now()}`,
      full_name: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      position: 'Test Position',
      experience_years: 1,
      qualification: 'Test Qualification',
      status: 'pending'
    };
    
    const { data, error } = await supabase
      .from('job_applications')
      .insert([testData])
      .select();
    
    if (error) {
      console.error('❌ RLS policy test failed:', error);
      return false;
    }
    
    console.log('✅ RLS policies allow insertion');
    
    // Clean up test data
    if (data && data[0]) {
      await supabase
        .from('job_applications')
        .delete()
        .eq('id', data[0].id);
      console.log('✅ Test data cleaned up');
    }
    
    return true;
  } catch (err) {
    console.error('❌ RLS test failed:', err);
    return false;
  }
}

async function testActualFormSubmission() {
  console.log('\n🧪 Testing actual form submission flow...\n');
  
  try {
    // Simulate the exact data structure from the form
    const formData = {
      full_name: 'Test User Complete',
      email: 'testcomplete@example.com',
      phone: '9876543210',
      date_of_birth: '1990-01-01',
      address: '123 Test Street, Test City',
      district: 'Test District',
      designation: 'Mathematics Teacher',
      subject: 'Mathematics',
      other_designation: '',
      qualifications: 'M.Sc Mathematics, B.Ed',
      experience_years: 5,
      previous_experience: '5 years teaching experience',
      why_join: 'I am passionate about education and want to contribute to student growth'
    };
    
    // Test the exact mapping used in the application
    const applicationData = {
      application_number: `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone,
      position: formData.designation || 'Not specified',
      designation: formData.designation || null,
      experience_years: formData.experience_years || 0,
      qualification: formData.qualifications || 'Not specified',
      qualifications: formData.qualifications || null,
      date_of_birth: formData.date_of_birth || null,
      address: formData.address || null,
      district: formData.district || null,
      subject: formData.subject || null,
      other_designation: formData.other_designation || null,
      previous_experience: formData.previous_experience || null,
      why_join: formData.why_join || null,
      cv_file: null,
      cover_letter: formData.why_join || null,
      status: 'pending',
    };
    
    console.log('Attempting to insert with current application mapping...');
    const { data, error } = await supabase
      .from('job_applications')
      .insert([applicationData])
      .select();
    
    if (error) {
      console.error('❌ Form submission test failed:', error);
      console.log('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return false;
    }
    
    console.log('✅ Form submission test successful!');
    console.log('Inserted data ID:', data[0]?.id);
    
    // Clean up
    if (data && data[0]) {
      await supabase
        .from('job_applications')
        .delete()
        .eq('id', data[0].id);
      console.log('✅ Test data cleaned up');
    }
    
    return true;
  } catch (err) {
    console.error('❌ Form submission test error:', err);
    return false;
  }
}

async function runDiagnostics() {
  console.log('🚀 Starting comprehensive job application diagnostics...\n');
  
  const results = {
    schema: await checkDatabaseSchema(),
    mapping: await checkFormFieldsMapping(),
    storage: await testStorageBucket(),
    rls: await testRLSPolicies(),
    submission: await testActualFormSubmission()
  };
  
  console.log('\n📊 DIAGNOSTIC RESULTS:');
  console.log('='.repeat(50));
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test.toUpperCase()}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    console.log('\n🎉 All diagnostics passed! The issue might be elsewhere.');
  } else {
    console.log('\n❌ Some diagnostics failed. Check the errors above for details.');
  }
  
  console.log('\n📝 RECOMMENDATIONS:');
  if (!results.schema) {
    console.log('- Run the SQL script to add missing columns to job_applications table');
  }
  if (!results.storage) {
    console.log('- Check storage bucket permissions and RLS policies');
  }
  if (!results.rls) {
    console.log('- Review RLS policies for job_applications table');
  }
  if (!results.submission) {
    console.log('- Check the exact error message for field mapping issues');
  }
  
  process.exit(allPassed ? 0 : 1);
}

runDiagnostics();