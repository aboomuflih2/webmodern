import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54323';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Initialize Supabase client with service role for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupJobApplicationsTable() {
  console.log('🔧 Setting up job_applications table and policies...');
  
  try {
    // Step 1: Create the table
    console.log('\n1️⃣ Creating job_applications table...');
    const createTableSQL = `
      -- Drop existing job_applications table if it exists
      DROP TABLE IF EXISTS job_applications CASCADE;
      
      -- Create job_applications table
      CREATE TABLE job_applications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          designation VARCHAR(100) NOT NULL,
          cv_file_path VARCHAR(500),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    if (createError) {
      console.error('❌ Table creation failed:', createError);
      return;
    }
    console.log('✅ Table created successfully');
    
    // Step 2: Enable RLS
    console.log('\n2️⃣ Enabling RLS...');
    const enableRLSSQL = `ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;`;
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: enableRLSSQL });
    if (rlsError) {
      console.error('❌ RLS enable failed:', rlsError);
    } else {
      console.log('✅ RLS enabled');
    }
    
    // Step 3: Create policies
    console.log('\n3️⃣ Creating RLS policies...');
    const policiesSQL = `
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Allow anonymous insert job applications" ON job_applications;
      DROP POLICY IF EXISTS "Allow authenticated read job applications" ON job_applications;
      
      -- Allow anonymous users to insert job applications
      CREATE POLICY "Allow anonymous insert job applications" ON job_applications
          FOR INSERT TO anon
          WITH CHECK (true);
      
      -- Allow authenticated users to view all applications
      CREATE POLICY "Allow authenticated read job applications" ON job_applications
          FOR SELECT TO authenticated
          USING (true);
    `;
    
    const { error: policiesError } = await supabase.rpc('exec_sql', { sql: policiesSQL });
    if (policiesError) {
      console.error('❌ Policies creation failed:', policiesError);
    } else {
      console.log('✅ Policies created');
    }
    
    // Step 4: Grant permissions
    console.log('\n4️⃣ Granting permissions...');
    const permissionsSQL = `
      GRANT SELECT, INSERT ON job_applications TO anon;
      GRANT ALL PRIVILEGES ON job_applications TO authenticated;
    `;
    
    const { error: permissionsError } = await supabase.rpc('exec_sql', { sql: permissionsSQL });
    if (permissionsError) {
      console.error('❌ Permissions grant failed:', permissionsError);
    } else {
      console.log('✅ Permissions granted');
    }
    
    // Step 5: Create storage bucket
    console.log('\n5️⃣ Creating storage bucket...');
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('cv-uploads', {
      public: false,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    });
    
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('❌ Bucket creation failed:', bucketError);
    } else {
      console.log('✅ Storage bucket ready');
    }
    
    // Step 6: Create storage policies
    console.log('\n6️⃣ Creating storage policies...');
    const storagePoliciesSQL = `
      -- Drop existing storage policies if they exist
      DROP POLICY IF EXISTS "Allow anonymous upload CVs" ON storage.objects;
      DROP POLICY IF EXISTS "Allow authenticated view CVs" ON storage.objects;
      
      -- Allow anonymous users to upload CVs
      CREATE POLICY "Allow anonymous upload CVs" ON storage.objects
          FOR INSERT TO anon
          WITH CHECK (bucket_id = 'cv-uploads');
      
      -- Allow authenticated users to view CVs
      CREATE POLICY "Allow authenticated view CVs" ON storage.objects
          FOR SELECT TO authenticated
          USING (bucket_id = 'cv-uploads');
    `;
    
    const { error: storagePoliciesError } = await supabase.rpc('exec_sql', { sql: storagePoliciesSQL });
    if (storagePoliciesError) {
      console.error('❌ Storage policies creation failed:', storagePoliciesError);
    } else {
      console.log('✅ Storage policies created');
    }
    
    console.log('\n🎉 Setup completed successfully!');
    
  } catch (error) {
    console.error('💥 Unexpected error during setup:', error);
  }
}

// Run the setup function
setupJobApplicationsTable().catch(console.error);