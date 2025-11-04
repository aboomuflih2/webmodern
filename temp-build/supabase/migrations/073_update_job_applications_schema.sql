-- Update job_applications table to match the career form fields
-- This migration adds missing columns and updates the schema

-- Add missing columns to job_applications table
ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS district text,
ADD COLUMN IF NOT EXISTS designation text,
ADD COLUMN IF NOT EXISTS qualifications text,
ADD COLUMN IF NOT EXISTS previous_experience text,
ADD COLUMN IF NOT EXISTS why_join text,
ADD COLUMN IF NOT EXISTS subject text,
ADD COLUMN IF NOT EXISTS other_designation text;

-- Rename position to match form field (designation is used in form)
-- We'll keep both for backward compatibility
ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS position_backup text;

-- Update existing position data to position_backup if needed
UPDATE public.job_applications 
SET position_backup = position 
WHERE position IS NOT NULL AND position_backup IS NULL;

-- Rename qualification to qualifications for consistency
ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS qualification_backup text;

-- Update existing qualification data to qualification_backup if needed
UPDATE public.job_applications 
SET qualification_backup = qualification 
WHERE qualification IS NOT NULL AND qualification_backup IS NULL;

-- Create index on new columns for better performance
CREATE INDEX IF NOT EXISTS idx_job_applications_designation ON public.job_applications(designation);
CREATE INDEX IF NOT EXISTS idx_job_applications_district ON public.job_applications(district);
CREATE INDEX IF NOT EXISTS idx_job_applications_date_of_birth ON public.job_applications(date_of_birth);

-- Update the RLS policies to ensure they still work with new columns
-- (The existing policies should continue to work)

-- Add comment to document the schema update
COMMENT ON TABLE public.job_applications IS 'Job applications table updated to match career form fields including date_of_birth, address, district, designation, qualifications, previous_experience, why_join, subject, and other_designation';