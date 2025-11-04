import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client with service role for admin operations
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  console.log('Required variables: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupGatePassStorage() {
  console.log('🚀 Setting up Gate Pass document storage...');
  
  try {
    // Check existing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }
    
    console.log('📁 Current buckets:', buckets.map(b => b.name));
    
    // Check if bucket already exists
    const bucketExists = buckets.some(bucket => bucket.name === 'gate-pass-documents');
    
    if (bucketExists) {
      console.log('✅ Storage bucket "gate-pass-documents" already exists');
    } else {
      // Create the bucket
      console.log('📦 Creating storage bucket "gate-pass-documents"...');
      const { data, error } = await supabase.storage.createBucket('gate-pass-documents', {
        public: false,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (error) {
        console.error('❌ Error creating bucket:', error);
        return;
      }
      
      console.log('✅ Storage bucket "gate-pass-documents" created successfully!');
    }
    
    // Enable RLS on storage.objects if not already enabled
    console.log('🔒 Setting up RLS policies...');
    
    // First, enable RLS on storage.objects
    const enableRLSQuery = `
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    `;
    
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: enableRLSQuery });
    if (rlsError && !rlsError.message.includes('already enabled')) {
      console.log('⚠️  Could not enable RLS via RPC:', rlsError.message);
    }
    
    console.log('⚠️  RLS policies need to be created manually via SQL:');
    console.log(`
-- Authenticated users can upload gate pass documents
          CREATE POLICY "Authenticated users can upload gate pass documents" ON storage.objects
          FOR INSERT TO authenticated
          WITH CHECK (bucket_id = 'gate-pass-documents');
`);
    
    console.log(`
-- Users can view their own gate pass documents
          CREATE POLICY "Users can view their own gate pass documents" ON storage.objects
          FOR SELECT TO authenticated
          USING (bucket_id = 'gate-pass-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
`);
    
    console.log(`
-- Admin users can view all gate pass documents
          CREATE POLICY "Admin users can view all gate pass documents" ON storage.objects
          FOR SELECT TO authenticated
          USING (bucket_id = 'gate-pass-documents' AND auth.jwt() ->> 'role' = 'admin');
`);
    
    console.log(`
-- Admin users can delete gate pass documents
          CREATE POLICY "Admin users can delete gate pass documents" ON storage.objects
          FOR DELETE TO authenticated
          USING (bucket_id = 'gate-pass-documents' AND auth.jwt() ->> 'role' = 'admin');
`);
    
    console.log('\n✅ Gate Pass storage setup completed!');
    console.log('📝 Next steps:');
    console.log('1. Run the RLS policy SQL commands above in Supabase Studio');
    console.log('2. Test the document upload functionality');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

setupGatePassStorage();