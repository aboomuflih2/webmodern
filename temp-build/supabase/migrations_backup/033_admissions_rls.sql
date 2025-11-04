-- Admissions module RLS policies and grants
-- Aligns policies to allow public submissions and admin management using is_admin()

-- Ensure RLS is enabled
ALTER TABLE public.kg_std_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plus_one_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admission_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_subject_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_subjects ENABLE ROW LEVEL SECURITY;

-- Drop legacy policies that rely on auth.jwt role claim
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='kg_std_applications' AND policyname='Admin full access'
  ) THEN
    EXECUTE 'DROP POLICY "Admin full access" ON public.kg_std_applications';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='plus_one_applications' AND policyname='Admin full access'
  ) THEN
    EXECUTE 'DROP POLICY "Admin full access" ON public.plus_one_applications';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='interview_subject_templates' AND policyname='Admin full access'
  ) THEN
    EXECUTE 'DROP POLICY "Admin full access" ON public.interview_subject_templates';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='interview_subjects' AND policyname='Admin full access'
  ) THEN
    EXECUTE 'DROP POLICY "Admin full access" ON public.interview_subjects';
  END IF;
END $$;

-- Public can submit applications
DROP POLICY IF EXISTS "Public can submit kg_std applications" ON public.kg_std_applications;
CREATE POLICY "Public can submit kg_std applications" ON public.kg_std_applications
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can submit plus_one applications" ON public.plus_one_applications;
CREATE POLICY "Public can submit plus_one applications" ON public.plus_one_applications
  FOR INSERT
  WITH CHECK (true);

-- Admin full access using is_admin()
DROP POLICY IF EXISTS "Allow admin full access to kg_std" ON public.kg_std_applications;
CREATE POLICY "Allow admin full access to kg_std" ON public.kg_std_applications
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Allow admin full access to plus_one" ON public.plus_one_applications;
CREATE POLICY "Allow admin full access to plus_one" ON public.plus_one_applications
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Allow admin full access to interview templates" ON public.interview_subject_templates;
CREATE POLICY "Allow admin full access to interview templates" ON public.interview_subject_templates
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Allow admin full access to interview subjects" ON public.interview_subjects;
CREATE POLICY "Allow admin full access to interview subjects" ON public.interview_subjects
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Admission forms management
DROP POLICY IF EXISTS "Allow admin full access to admission_forms" ON public.admission_forms;
CREATE POLICY "Allow admin full access to admission_forms" ON public.admission_forms
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Keep public read access where appropriate
-- Public can read applications to support tracking, if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='kg_std_applications' AND policyname='Public read access'
  ) THEN
    EXECUTE 'CREATE POLICY "Public read access" ON public.kg_std_applications FOR SELECT USING (true)';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='plus_one_applications' AND policyname='Public read access'
  ) THEN
    EXECUTE 'CREATE POLICY "Public read access" ON public.plus_one_applications FOR SELECT USING (true)';
  END IF;
END $$;

-- Grants (defensive; these do not bypass RLS)
GRANT SELECT ON public.kg_std_applications TO anon;
GRANT SELECT ON public.plus_one_applications TO anon;
GRANT ALL ON public.kg_std_applications TO authenticated;
GRANT ALL ON public.plus_one_applications TO authenticated;
GRANT ALL ON public.interview_subject_templates TO authenticated;
GRANT ALL ON public.interview_subjects TO authenticated;
GRANT ALL ON public.admission_forms TO authenticated;

SELECT 'Admissions RLS updated' AS status;

