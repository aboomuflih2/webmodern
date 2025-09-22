-- Drop existing job_applications table if it exists
DROP TABLE IF EXISTS job_applications CASCADE;

-- Create job_applications table with minimal required fields
CREATE TABLE job_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    cv_file_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on job_applications table
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous insert job applications" ON job_applications;
DROP POLICY IF EXISTS "Allow authenticated read job applications" ON job_applications;

-- Allow anonymous users to insert job applications (public can apply)
CREATE POLICY "Allow anonymous insert job applications" ON job_applications
    FOR INSERT TO anon
    WITH CHECK (true);

-- Allow authenticated users to view all applications (for admin)
CREATE POLICY "Allow authenticated read job applications" ON job_applications
    FOR SELECT TO authenticated
    USING (true);

-- Grant permissions to anon and authenticated roles
GRANT SELECT, INSERT ON job_applications TO anon;
GRANT ALL PRIVILEGES ON job_applications TO authenticated;

-- Create storage bucket for CV uploads (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cv-uploads',
  'cv-uploads',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Allow anonymous upload CVs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated view CVs" ON storage.objects;

-- Allow anonymous users to upload CVs
CREATE POLICY "Allow anonymous upload CVs" ON storage.objects
    FOR INSERT TO anon
    WITH CHECK (bucket_id = 'cv-uploads');

-- Allow authenticated users to view CVs (for admin)
CREATE POLICY "Allow authenticated view CVs" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'cv-uploads');

-- Grant storage permissions
GRANT SELECT ON storage.buckets TO anon, authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT INSERT ON storage.objects TO anon;