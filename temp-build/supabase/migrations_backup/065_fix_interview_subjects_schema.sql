-- Align interview_subjects schema to app expectations

-- Handle marks column migration properly
DO $$
BEGIN
  -- If marks_obtained exists and marks doesn't, rename it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='interview_subjects' AND column_name='marks_obtained'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='interview_subjects' AND column_name='marks'
  ) THEN
    EXECUTE 'ALTER TABLE public.interview_subjects RENAME COLUMN marks_obtained TO marks';
  -- If both exist, copy data from marks_obtained to marks and drop marks_obtained
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='interview_subjects' AND column_name='marks_obtained'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='interview_subjects' AND column_name='marks'
  ) THEN
    EXECUTE 'UPDATE public.interview_subjects SET marks = marks_obtained WHERE marks_obtained IS NOT NULL';
    EXECUTE 'ALTER TABLE public.interview_subjects DROP COLUMN marks_obtained';
  -- If neither exists, add marks column
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='interview_subjects' AND column_name='marks'
  ) THEN
    EXECUTE 'ALTER TABLE public.interview_subjects ADD COLUMN marks integer';
  END IF;
END $$;

-- Add other columns as needed
ALTER TABLE public.interview_subjects
  ADD COLUMN IF NOT EXISTS application_type text,
  ADD COLUMN IF NOT EXISTS subject_name text,
  ADD COLUMN IF NOT EXISTS max_marks integer DEFAULT 25;

-- RLS: keep admin full access using is_admin()
ALTER TABLE public.interview_subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admin full access to interview subjects" ON public.interview_subjects;
CREATE POLICY "Allow admin full access to interview subjects" ON public.interview_subjects
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

GRANT ALL ON public.interview_subjects TO authenticated;

SELECT 'interview subjects schema aligned' AS status;

