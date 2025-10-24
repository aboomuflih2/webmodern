-- Ensure job_applications allows anonymous inserts and authenticated reads
DO $$
BEGIN
  -- Create table if missing (minimal cols used by form)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'job_applications'
  ) THEN
    CREATE TABLE public.job_applications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name varchar(255) NOT NULL,
      email varchar(255) NOT NULL,
      phone varchar(20) NOT NULL,
      designation varchar(100) NOT NULL,
      subject varchar(100),
      other_designation varchar(255),
      experience_years integer NOT NULL DEFAULT 0,
      qualifications text NOT NULL,
      district varchar(100) NOT NULL,
      address text NOT NULL,
      cv_file_path varchar(500),
      cover_letter text,
      created_at timestamptz DEFAULT now()
    );
  END IF;

  -- Enable RLS
  EXECUTE 'ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY';

  -- Drop conflicting policies if exist
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'job_applications' AND policyname = 'Allow anonymous insert job applications'
  ) THEN
    EXECUTE 'DROP POLICY "Allow anonymous insert job applications" ON public.job_applications';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'job_applications' AND policyname = 'Allow authenticated read job applications'
  ) THEN
    EXECUTE 'DROP POLICY "Allow authenticated read job applications" ON public.job_applications';
  END IF;

  -- Recreate policies
  EXECUTE 'CREATE POLICY "Allow anonymous insert job applications" ON public.job_applications FOR INSERT TO anon WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow authenticated read job applications" ON public.job_applications FOR SELECT TO authenticated USING (true)';

  -- Grants
  EXECUTE 'GRANT INSERT ON public.job_applications TO anon';
  EXECUTE 'GRANT ALL ON public.job_applications TO authenticated';
END $$;

SELECT 'job_applications RLS fixed (public only)' AS status;