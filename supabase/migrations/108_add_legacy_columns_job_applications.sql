-- Ensure legacy columns exist for job_applications to accept union payloads

ALTER TABLE public.job_applications 
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS mobile text,
  ADD COLUMN IF NOT EXISTS place text,
  ADD COLUMN IF NOT EXISTS post_office text,
  ADD COLUMN IF NOT EXISTS pincode text,
  ADD COLUMN IF NOT EXISTS subject_specification text,
  ADD COLUMN IF NOT EXISTS specify_other text,
  ADD COLUMN IF NOT EXISTS cv_file_path text,
  ADD COLUMN IF NOT EXISTS cv_file_name text;

-- Optional: set defaults for status if not present
ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
