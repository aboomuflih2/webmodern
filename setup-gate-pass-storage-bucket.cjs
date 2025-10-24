const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment
require('dotenv').config();
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupGatePassStorage() {
  try {
    console.log('Setting up gate-pass-documents storage bucket...');
    
    // Create the bucket
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('gate-pass-documents', {
      public: false,
      allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
      fileSizeLimit: 5242880 // 5MB
    });
    
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('Error creating bucket:', bucketError);
      return;
    }
    
    console.log('Bucket created or already exists');
    
    // Create RLS policies for the bucket
    const policies = [
      {
        name: 'Allow anonymous uploads to gate-pass-documents',
        sql: `
          CREATE POLICY "Allow anonymous uploads to gate-pass-documents" ON storage.objects
          FOR INSERT WITH CHECK (
            bucket_id = 'gate-pass-documents' AND
            auth.role() = 'anon'
          );
        `
      },
      {
        name: 'Allow authenticated users to upload to gate-pass-documents',
        sql: `
          CREATE POLICY "Allow authenticated users to upload to gate-pass-documents" ON storage.objects
          FOR INSERT WITH CHECK (
            bucket_id = 'gate-pass-documents' AND
            auth.role() = 'authenticated'
          );
        `
      },
      {
        name: 'Allow admin users to view all gate-pass documents',
        sql: `
          CREATE POLICY "Allow admin users to view all gate-pass documents" ON storage.objects
          FOR SELECT USING (
            bucket_id = 'gate-pass-documents' AND
            EXISTS (
              SELECT 1 FROM public.user_roles ur
              WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
            )
          );
        `
      },
      {
        name: 'Allow users to view their own gate-pass documents',
        sql: `
          CREATE POLICY "Allow users to view their own gate-pass documents" ON storage.objects
          FOR SELECT USING (
            bucket_id = 'gate-pass-documents' AND
            auth.uid()::text = (storage.foldername(name))[1]
          );
        `
      }
    ];
    
    // Apply each policy
    for (const policy of policies) {
      console.log(`Creating policy: ${policy.name}`);
      const { error: policyError } = await supabase.rpc('exec', {
        sql: policy.sql
      });
      
      if (policyError && !policyError.message.includes('already exists')) {
        console.error(`Error creating policy ${policy.name}:`, policyError);
      } else {
        console.log(`Policy ${policy.name} created successfully`);
      }
    }
    
    console.log('Gate pass storage setup completed successfully!');
    
  } catch (error) {
    console.error('Error setting up gate pass storage:', error);
  }
}

setupGatePassStorage();