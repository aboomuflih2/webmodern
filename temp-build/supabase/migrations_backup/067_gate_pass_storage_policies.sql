-- Create RLS policies for gate-pass-documents storage bucket

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous uploads to gate-pass-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload to gate-pass-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin users to view all gate-pass documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view their own gate-pass documents" ON storage.objects;

-- Allow anonymous uploads to gate-pass-documents
CREATE POLICY "Allow anonymous uploads to gate-pass-documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'gate-pass-documents' AND
  auth.role() = 'anon'
);

-- Allow authenticated users to upload to gate-pass-documents
CREATE POLICY "Allow authenticated users to upload to gate-pass-documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'gate-pass-documents' AND
  auth.role() = 'authenticated'
);

-- Allow admin users to view all gate-pass documents
CREATE POLICY "Allow admin users to view all gate-pass documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'gate-pass-documents' AND
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Allow users to view their own gate-pass documents
CREATE POLICY "Allow users to view their own gate-pass documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'gate-pass-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT ON storage.objects TO anon;
GRANT ALL ON storage.objects TO authenticated;