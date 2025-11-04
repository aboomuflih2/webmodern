-- Comprehensive fix for job application submission issues
-- Run this in Supabase SQL Editor

-- 1. First, add missing columns to job_applications table
ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS date_of_birth date;

ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS address text;

ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS district text;

ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS designation text;

ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS qualifications text;

ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS previous_experience text;

ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS why_join text;

ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS subject text;

ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS other_designation text;

-- 2. Fix RLS policies for job_applications
-- Drop existing policies first
DROP POLICY IF EXISTS "Public can insert job applications" ON public.job_applications;
DROP POLICY IF EXISTS "Admin can view all job applications" ON public.job_applications;

-- Create new, more permissive policies
CREATE POLICY "Allow public insert job applications" ON public.job_applications
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow public select job applications" ON public.job_applications
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Admin can manage all job applications" ON public.job_applications
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 3. Ensure proper grants
GRANT SELECT, INSERT ON public.job_applications TO anon;
GRANT SELECT, INSERT ON public.job_applications TO authenticated;

-- 4. Fix storage bucket policies for document-uploads
-- Allow public uploads to document-uploads bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('document-uploads', 'document-uploads', false, 52428800, ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
])
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY[
        'application/pdf',
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ];

-- 5. Create storage policies for document uploads
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;

CREATE POLICY "Allow public uploads to document-uploads" ON storage.objects
    FOR INSERT TO anon, authenticated
    WITH CHECK (bucket_id = 'document-uploads');

CREATE POLICY "Allow public downloads from document-uploads" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'document-uploads');

CREATE POLICY "Allow admin access to all storage" ON storage.objects
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_applications_designation ON public.job_applications(designation);
CREATE INDEX IF NOT EXISTS idx_job_applications_district ON public.job_applications(district);
CREATE INDEX IF NOT EXISTS idx_job_applications_date_of_birth ON public.job_applications(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_job_applications_subject ON public.job_applications(subject);

-- 7. Verify the setup with a test query (optional)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'job_applications' 
-- AND table_schema = 'public'
-- ORDER BY ordinal_position;