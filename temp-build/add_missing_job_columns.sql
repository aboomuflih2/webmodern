-- SQL script to add missing columns to job_applications table
-- Run this in Supabase SQL Editor

-- Add missing columns to job_applications table
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

-- Create indexes for better performance on commonly queried fields
CREATE INDEX IF NOT EXISTS idx_job_applications_designation ON public.job_applications(designation);
CREATE INDEX IF NOT EXISTS idx_job_applications_district ON public.job_applications(district);
CREATE INDEX IF NOT EXISTS idx_job_applications_date_of_birth ON public.job_applications(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_job_applications_subject ON public.job_applications(subject);

-- Verify the table structure (optional - you can run this to check)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'job_applications' 
-- AND table_schema = 'public'
-- ORDER BY ordinal_position;