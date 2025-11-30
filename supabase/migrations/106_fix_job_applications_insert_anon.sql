-- Ensure anonymous users can insert into job_applications

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON public.job_applications TO anon;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'job_applications' AND policyname = 'Allow anonymous insert job applications'
  ) THEN
    CREATE POLICY "Allow anonymous insert job applications" ON public.job_applications
      FOR INSERT TO anon
      WITH CHECK (true);
  END IF;
END $$;
