import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStoragePolicies() {
  console.log('🔒 Setting up RLS policies for gate-pass-documents bucket...');
  
  const policies = [
    {
      name: 'Authenticated users can upload gate pass documents',
      sql: `
        CREATE POLICY "Authenticated users can upload gate pass documents" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'gate-pass-documents');
      `
    },
    {
      name: 'Users can view their own gate pass documents',
      sql: `
        CREATE POLICY "Users can view their own gate pass documents" ON storage.objects
        FOR SELECT TO authenticated
        USING (bucket_id = 'gate-pass-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
      `
    },
    {
      name: 'Admin users can view all gate pass documents',
      sql: `
        CREATE POLICY "Admin users can view all gate pass documents" ON storage.objects
        FOR SELECT TO authenticated
        USING (bucket_id = 'gate-pass-documents' AND auth.jwt() ->> 'role' = 'admin');
      `
    },
    {
      name: 'Admin users can delete gate pass documents',
      sql: `
        CREATE POLICY "Admin users can delete gate pass documents" ON storage.objects
        FOR DELETE TO authenticated
        USING (bucket_id = 'gate-pass-documents' AND auth.jwt() ->> 'role' = 'admin');
      `
    }
  ];
  
  try {
    // First, enable RLS on storage.objects if not already enabled
    console.log('📋 Enabling RLS on storage.objects...');
    const enableRLSResult = await supabase.rpc('sql', {
      query: 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;'
    });
    
    if (enableRLSResult.error && !enableRLSResult.error.message.includes('already exists')) {
      console.log('⚠️  RLS might already be enabled:', enableRLSResult.error.message);
    } else {
      console.log('✅ RLS enabled on storage.objects');
    }
    
    // Apply each policy
    for (const policy of policies) {
      console.log(`📝 Creating policy: ${policy.name}`);
      
      const { data, error } = await supabase.rpc('sql', {
        query: policy.sql
      });
      
      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`✅ Policy "${policy.name}" already exists`);
        } else {
          console.error(`❌ Error creating policy "${policy.name}":`, error.message);
        }
      } else {
        console.log(`✅ Policy "${policy.name}" created successfully`);
      }
    }
    
    console.log('\n✅ Storage policies setup completed!');
    
  } catch (error) {
    console.error('❌ Error setting up storage policies:', error);
  }
}

setupStoragePolicies();