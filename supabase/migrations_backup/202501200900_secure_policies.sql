-- Tighten permissions and row-level security policies

-- Ensure anon users cannot mutate breaking_news
REVOKE ALL PRIVILEGES ON public.breaking_news FROM anon;
GRANT SELECT ON public.breaking_news TO anon;
GRANT ALL PRIVILEGES ON public.breaking_news TO authenticated;

DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Allow anon insert access to breaking_news" ON public.breaking_news';
  EXECUTE 'DROP POLICY IF EXISTS "Allow anon update access to breaking_news" ON public.breaking_news';
  EXECUTE 'DROP POLICY IF EXISTS "Allow anon delete access to breaking_news" ON public.breaking_news';
  EXECUTE 'DROP POLICY IF EXISTS "Allow public read access to breaking_news" ON public.breaking_news';
  EXECUTE 'DROP POLICY IF EXISTS "Active breaking news is viewable by everyone" ON public.breaking_news';
  EXECUTE 'DROP POLICY IF EXISTS "Allow admin full access to breaking_news" ON public.breaking_news';
  EXECUTE 'DROP POLICY IF EXISTS "Enable all operations for admin users" ON public.breaking_news';
END $$;

CREATE POLICY "Allow public read active breaking_news" ON public.breaking_news
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow admin manage breaking_news" ON public.breaking_news
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Remove legacy "Allow all for testing" policies that disable RLS safeguards
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'news_posts' AND policyname = 'Allow all for testing'
  ) THEN
    EXECUTE 'DROP POLICY "Allow all for testing" ON public.news_posts';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'hero_slides' AND policyname = 'Allow all for testing'
  ) THEN
    EXECUTE 'DROP POLICY "Allow all for testing" ON public.hero_slides';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'academic_programs' AND policyname = 'Allow all for testing'
  ) THEN
    EXECUTE 'DROP POLICY "Allow all for testing" ON public.academic_programs';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'testimonials' AND policyname = 'Allow all for testing'
  ) THEN
    EXECUTE 'DROP POLICY "Allow all for testing" ON public.testimonials';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contact_submissions' AND policyname = 'Allow all for testing'
  ) THEN
    EXECUTE 'DROP POLICY "Allow all for testing" ON public.contact_submissions';
  END IF;
END $$;

-- Lock down admissions data to admins only (client access now goes through protected edge functions)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'kg_std_applications' AND policyname = 'Public read access'
  ) THEN
    EXECUTE 'DROP POLICY "Public read access" ON public.kg_std_applications';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'plus_one_applications' AND policyname = 'Public read access'
  ) THEN
    EXECUTE 'DROP POLICY "Public read access" ON public.plus_one_applications';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'interview_subjects' AND policyname = 'Public read access'
  ) THEN
    EXECUTE 'DROP POLICY "Public read access" ON public.interview_subjects';
  END IF;
END $$;

-- Ensure interview data remains restricted to admins
GRANT ALL PRIVILEGES ON public.interview_subjects TO authenticated;
REVOKE ALL PRIVILEGES ON public.interview_subjects FROM anon;

SELECT 'Security policies tightened' AS status;
