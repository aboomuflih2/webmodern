-- Fix interview_subjects table schema - ensure all required columns exist
-- This addresses the missing application_type column error

DO $$
BEGIN
  -- Check if interview_subjects table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'interview_subjects'
  ) THEN
    
    -- Add application_type column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'interview_subjects' 
      AND column_name = 'application_type'
    ) THEN
      ALTER TABLE public.interview_subjects 
      ADD COLUMN application_type text;
      
      RAISE NOTICE 'Added application_type column to interview_subjects table';
    END IF;
    
    -- Add subject_name column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'interview_subjects' 
      AND column_name = 'subject_name'
    ) THEN
      ALTER TABLE public.interview_subjects 
      ADD COLUMN subject_name text;
      
      RAISE NOTICE 'Added subject_name column to interview_subjects table';
    END IF;
    
    -- Add max_marks column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'interview_subjects' 
      AND column_name = 'max_marks'
    ) THEN
      ALTER TABLE public.interview_subjects 
      ADD COLUMN max_marks integer DEFAULT 25;
      
      RAISE NOTICE 'Added max_marks column to interview_subjects table';
    END IF;
    
    -- Ensure marks column exists (rename from marks_obtained if needed)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'interview_subjects' 
      AND column_name = 'marks_obtained'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'interview_subjects' 
      AND column_name = 'marks'
    ) THEN
      ALTER TABLE public.interview_subjects 
      RENAME COLUMN marks_obtained TO marks;
      
      RAISE NOTICE 'Renamed marks_obtained to marks in interview_subjects table';
    ELSIF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'interview_subjects' 
      AND column_name = 'marks'
    ) THEN
      ALTER TABLE public.interview_subjects 
      ADD COLUMN marks integer;
      
      RAISE NOTICE 'Added marks column to interview_subjects table';
    END IF;
    
    -- Ensure application_id column exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'interview_subjects' 
      AND column_name = 'application_id'
    ) THEN
      ALTER TABLE public.interview_subjects 
      ADD COLUMN application_id uuid;
      
      RAISE NOTICE 'Added application_id column to interview_subjects table';
    END IF;
    
    -- Enable RLS and create policies
    ALTER TABLE public.interview_subjects ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Allow admin full access to interview subjects" ON public.interview_subjects;
    DROP POLICY IF EXISTS "Public read access" ON public.interview_subjects;
    
    -- Create RLS policies
    CREATE POLICY "Allow admin full access to interview subjects" ON public.interview_subjects
      FOR ALL USING (is_admin()) WITH CHECK (is_admin());
    
    -- Grant permissions
    GRANT ALL ON public.interview_subjects TO authenticated;
    GRANT SELECT ON public.interview_subjects TO anon;
    
    RAISE NOTICE 'RLS policies and permissions set for interview_subjects table';
    
  ELSE
    RAISE NOTICE 'interview_subjects table does not exist';
  END IF;
END $$;

SELECT 'interview_subjects schema fix completed - all required columns ensured' AS status;