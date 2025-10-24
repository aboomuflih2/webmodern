-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload gate pass documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own gate pass documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can view all gate pass documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can delete gate pass documents" ON storage.objects;

-- Grant necessary permissions on storage schema
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Create policies for gate-pass-documents bucket

-- 1. Authenticated users can upload gate pass documents
CREATE POLICY "Authenticated users can upload gate pass documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'gate-pass-documents');

-- 2. Users can view their own gate pass documents
CREATE POLICY "Users can view their own gate pass documents" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'gate-pass-documents');

-- 3. Admin users can view all gate pass documents
CREATE POLICY "Admin users can view all gate pass documents" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'gate-pass-documents' AND auth.jwt() ->> 'role' = 'admin');

-- 4. Admin users can delete gate pass documents
CREATE POLICY "Admin users can delete gate pass documents" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'gate-pass-documents' AND auth.jwt() ->> 'role' = 'admin');

-- 5. Allow authenticated users to update their own files (for metadata)
CREATE POLICY "Users can update their own gate pass documents" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'gate-pass-documents');

-- Grant permissions on gate_pass_requests table
GRANT SELECT, INSERT, UPDATE ON gate_pass_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON gate_pass_requests TO anon;

-- Ensure RLS is enabled on gate_pass_requests
ALTER TABLE gate_pass_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for gate_pass_requests
DROP POLICY IF EXISTS "Users can manage their own gate pass requests" ON gate_pass_requests;
CREATE POLICY "Users can manage their own gate pass requests" ON gate_pass_requests
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Allow anonymous users to insert gate pass requests
DROP POLICY IF EXISTS "Anonymous users can create gate pass requests" ON gate_pass_requests;
CREATE POLICY "Anonymous users can create gate pass requests" ON gate_pass_requests
FOR INSERT TO anon
WITH CHECK (true);

-- Allow anonymous users to read gate pass requests (for form validation)
DROP POLICY IF EXISTS "Anonymous users can read gate pass requests" ON gate_pass_requests;
CREATE POLICY "Anonymous users can read gate pass requests" ON gate_pass_requests
FOR SELECT TO anon
USING (true);