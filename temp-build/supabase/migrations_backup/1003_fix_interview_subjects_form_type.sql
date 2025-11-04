-- Fix interview_subject_templates form_type CHECK constraint and remove legacy tables
-- This migration standardizes allowed form_type values to ('kg_std', 'plus_one')
-- and drops any legacy/backup tables that may cause confusion.

-- Ensure the table exists before applying changes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'interview_subject_templates'
  ) THEN
    RAISE EXCEPTION 'Table interview_subject_templates does not exist';
  END IF;
END $$;

-- Add form_type column if missing
ALTER TABLE public.interview_subject_templates
  ADD COLUMN IF NOT EXISTS form_type text;

-- Drop existing CHECK constraint if present
ALTER TABLE public.interview_subject_templates
  DROP CONSTRAINT IF EXISTS interview_subject_templates_form_type_check;

-- Remove rows with invalid form_type values to avoid violations
DELETE FROM public.interview_subject_templates
WHERE form_type IS NOT NULL
  AND form_type NOT IN ('kg_std', 'plus_one');

-- Recreate CHECK constraint to only allow valid values
ALTER TABLE public.interview_subject_templates
  ADD CONSTRAINT interview_subject_templates_form_type_check
  CHECK (form_type IN ('kg_std', 'plus_one'));

-- Optional: ensure form_type is not null for future inserts via UI
-- Commented out to avoid impacting existing rows without form_type
-- ALTER TABLE public.interview_subject_templates ALTER COLUMN form_type SET NOT NULL;

-- Clean up legacy/backup tables if they exist
DROP TABLE IF EXISTS public.interview_subject_templates_backup CASCADE;
DROP TABLE IF EXISTS public.interview_subject_templates_legacy CASCADE;
DROP TABLE IF EXISTS public.interview_templates CASCADE;

-- Grant permissions remain as previously configured; no changes here
-- RLS policies remain unchanged

-- End of migration