-- Create storage bucket for gate pass documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gate-pass-documents',
  'gate-pass-documents',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload documents
CREATE POLICY "Allow authenticated users to upload gate pass documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'gate-pass-documents' AND
  auth.role() = 'authenticated'
);

-- Policy: Allow users to view their own uploaded documents
CREATE POLICY "Allow users to view their own gate pass documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'gate-pass-documents' AND
  (
    auth.role() = 'authenticated' OR
    auth.role() = 'anon'
  )
);

-- Policy: Allow admin users to view all documents
CREATE POLICY "Allow admin users to view all gate pass documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'gate-pass-documents' AND
  auth.role() = 'authenticated'
);

-- Policy: Allow users to update their own documents
CREATE POLICY "Allow users to update their own gate pass documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'gate-pass-documents' AND
  auth.role() = 'authenticated'
);

-- Policy: Allow users to delete their own documents
CREATE POLICY "Allow users to delete their own gate pass documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'gate-pass-documents' AND
  auth.role() = 'authenticated'
);

-- Grant necessary permissions
GRANT ALL ON storage.objects TO anon;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO anon;
GRANT ALL ON storage.buckets TO authenticated;