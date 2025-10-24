-- Allow anonymous users to upload to gate-pass-documents bucket
-- This is needed for the gate pass form to work for non-authenticated users

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Authenticated users can upload gate pass documents" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can upload gate pass documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own gate pass documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can view gate pass documents" ON storage.objects;

-- Create policy to allow anonymous users to upload gate pass documents
CREATE POLICY "Anonymous users can upload gate pass documents" ON storage.objects
FOR INSERT TO anon
WITH CHECK (bucket_id = 'gate-pass-documents');

-- Create policy to allow authenticated users to upload gate pass documents
CREATE POLICY "Authenticated users can upload gate pass documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'gate-pass-documents');

-- Allow public read access to gate pass documents (for admin viewing)
CREATE POLICY "Public can view gate pass documents" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'gate-pass-documents');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO anon;
GRANT INSERT ON storage.objects TO anon;
GRANT SELECT ON storage.objects TO anon;

-- Ensure the gate_pass_requests table allows anon inserts
GRANT INSERT ON gate_pass_requests TO anon;
GRANT SELECT ON gate_pass_requests TO anon;