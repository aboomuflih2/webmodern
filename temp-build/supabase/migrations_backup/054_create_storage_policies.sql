-- Enable RLS on storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload gate pass documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own gate pass documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can view all gate pass documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can delete gate pass documents" ON storage.objects;

-- Policy 1: Allow authenticated users to upload files to gate-pass-documents bucket
CREATE POLICY "Authenticated users can upload gate pass documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'gate-pass-documents');

-- Policy 2: Allow users to view their own uploaded files
-- Files are organized by user ID in folders
CREATE POLICY "Users can view their own gate pass documents" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'gate-pass-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy 3: Allow admin users to view all files
CREATE POLICY "Admin users can view all gate pass documents" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'gate-pass-documents' AND auth.jwt() ->> 'role' = 'admin');

-- Policy 4: Allow admin users to delete files
CREATE POLICY "Admin users can delete gate pass documents" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'gate-pass-documents' AND auth.jwt() ->> 'role' = 'admin');

-- Grant necessary permissions on storage schema
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

SELECT 'Storage policies for gate-pass-documents bucket created successfully' as status;