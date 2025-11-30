-- Create cv-uploads bucket for job application CVs and attach permissive policies for public submissions

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cv-uploads',
  'cv-uploads',
  false,
  10485760,
  ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anonymous users to upload CVs to cv-uploads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow anonymous upload CVs (cv-uploads)'
  ) THEN
    CREATE POLICY "Allow anonymous upload CVs (cv-uploads)" ON storage.objects
      FOR INSERT TO anon
      WITH CHECK (bucket_id = 'cv-uploads');
  END IF;
END $$;

-- Allow authenticated users to view CVs in cv-uploads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow authenticated view CVs (cv-uploads)'
  ) THEN
    CREATE POLICY "Allow authenticated view CVs (cv-uploads)" ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'cv-uploads');
  END IF;
END $$;

-- Allow authenticated users to delete CVs in cv-uploads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow authenticated delete CVs (cv-uploads)'
  ) THEN
    CREATE POLICY "Allow authenticated delete CVs (cv-uploads)" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'cv-uploads');
  END IF;
END $$;

GRANT USAGE ON SCHEMA storage TO anon, authenticated;
