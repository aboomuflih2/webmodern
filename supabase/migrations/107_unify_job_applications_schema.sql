ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS application_number text,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS position text,
  ADD COLUMN IF NOT EXISTS experience_years integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qualification text,
  ADD COLUMN IF NOT EXISTS qualifications text,
  ADD COLUMN IF NOT EXISTS cv_file text,
  ADD COLUMN IF NOT EXISTS cover_letter text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS other_designation text,
  ADD COLUMN IF NOT EXISTS previous_experience text,
  ADD COLUMN IF NOT EXISTS why_join text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS idx_job_applications_app_number ON public.job_applications(application_number);
CREATE INDEX IF NOT EXISTS idx_job_applications_designation ON public.job_applications(designation);
CREATE INDEX IF NOT EXISTS idx_job_applications_district ON public.job_applications(district);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON public.job_applications(created_at);

CREATE OR REPLACE FUNCTION public.normalize_job_applications()
RETURNS trigger AS $$
BEGIN
  NEW.full_name := COALESCE(NEW.full_name, NEW.name);
  NEW.name := COALESCE(NEW.name, NEW.full_name);

  NEW.phone := COALESCE(NEW.phone, NEW.mobile);
  NEW.mobile := COALESCE(NEW.mobile, NEW.phone);

  NEW.subject := COALESCE(NEW.subject, NEW.subject_specification);
  NEW.subject_specification := COALESCE(NEW.subject_specification, NEW.subject);

  NEW.other_designation := COALESCE(NEW.other_designation, NEW.specify_other);
  NEW.specify_other := COALESCE(NEW.specify_other, NEW.other_designation);

  NEW.cv_file := COALESCE(NEW.cv_file, NEW.cv_file_path);
  NEW.cv_file_path := COALESCE(NEW.cv_file_path, NEW.cv_file);

  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'normalize_job_applications_trigger'
  ) THEN
    CREATE TRIGGER normalize_job_applications_trigger
    BEFORE INSERT OR UPDATE ON public.job_applications
    FOR EACH ROW EXECUTE FUNCTION public.normalize_job_applications();
  END IF;
END $$;
