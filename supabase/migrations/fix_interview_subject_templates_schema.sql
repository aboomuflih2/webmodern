-- Fix interview_subject_templates table schema to ensure all required columns exist
-- This addresses the 'max_marks' column error and ensures complete schema alignment

DO $$
BEGIN
  -- Check if the table exists, if not create it with complete schema
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'interview_subject_templates'
  ) THEN
    -- Create the table with all required columns
    CREATE TABLE public.interview_subject_templates (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      form_type text NOT NULL CHECK (form_type IN ('kg_std','plus_one')),
      subject_name text NOT NULL,
      max_marks integer NOT NULL DEFAULT 25,
      display_order integer NOT NULL DEFAULT 0,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    
    RAISE NOTICE 'Created interview_subject_templates table with complete schema';
  ELSE
    -- Table exists, check and add missing columns
    
    -- Check and add max_marks column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'interview_subject_templates' 
      AND column_name = 'max_marks'
    ) THEN
      ALTER TABLE public.interview_subject_templates 
      ADD COLUMN max_marks integer NOT NULL DEFAULT 25;
      
      RAISE NOTICE 'Added max_marks column to interview_subject_templates table';
    END IF;
    
    -- Check and add form_type column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'interview_subject_templates' 
      AND column_name = 'form_type'
    ) THEN
      ALTER TABLE public.interview_subject_templates 
      ADD COLUMN form_type text;
      
      -- Set default values for existing records
      UPDATE public.interview_subject_templates 
      SET form_type = 'kg_std' 
      WHERE form_type IS NULL;
      
      -- Make the column NOT NULL and add constraint
      ALTER TABLE public.interview_subject_templates 
      ALTER COLUMN form_type SET NOT NULL;
      
      ALTER TABLE public.interview_subject_templates 
      ADD CONSTRAINT check_form_type CHECK (form_type IN ('kg_std','plus_one'));
      
      RAISE NOTICE 'Added form_type column to interview_subject_templates table';
    END IF;
    
    -- Check and add subject_name column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'interview_subject_templates' 
      AND column_name = 'subject_name'
    ) THEN
      ALTER TABLE public.interview_subject_templates 
      ADD COLUMN subject_name text NOT NULL DEFAULT 'Subject';
      
      RAISE NOTICE 'Added subject_name column to interview_subject_templates table';
    END IF;
    
    -- Check and add display_order column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'interview_subject_templates' 
      AND column_name = 'display_order'
    ) THEN
      ALTER TABLE public.interview_subject_templates 
      ADD COLUMN display_order integer NOT NULL DEFAULT 0;
      
      RAISE NOTICE 'Added display_order column to interview_subject_templates table';
    END IF;
    
    -- Check and add is_active column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'interview_subject_templates' 
      AND column_name = 'is_active'
    ) THEN
      ALTER TABLE public.interview_subject_templates 
      ADD COLUMN is_active boolean NOT NULL DEFAULT true;
      
      RAISE NOTICE 'Added is_active column to interview_subject_templates table';
    END IF;
    
    -- Check and add created_at column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'interview_subject_templates' 
      AND column_name = 'created_at'
    ) THEN
      ALTER TABLE public.interview_subject_templates 
      ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
      
      RAISE NOTICE 'Added created_at column to interview_subject_templates table';
    END IF;
    
    -- Check and add updated_at column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'interview_subject_templates' 
      AND column_name = 'updated_at'
    ) THEN
      ALTER TABLE public.interview_subject_templates 
      ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
      
      RAISE NOTICE 'Added updated_at column to interview_subject_templates table';
    END IF;
  END IF;
  
  -- Create unique index if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'interview_subject_templates' 
    AND indexname = 'ux_interview_templates_form_subject'
  ) THEN
    CREATE UNIQUE INDEX ux_interview_templates_form_subject 
    ON public.interview_subject_templates(form_type, subject_name);
    
    RAISE NOTICE 'Created unique index on form_type and subject_name';
  END IF;
  
  -- Enable RLS and set up policies
  ALTER TABLE public.interview_subject_templates ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Public read interview templates" ON public.interview_subject_templates;
  DROP POLICY IF EXISTS "Allow admin full access to interview templates" ON public.interview_subject_templates;
  
  -- Create policies
  CREATE POLICY "Public read interview templates" ON public.interview_subject_templates
    FOR SELECT USING (true);
    
  CREATE POLICY "Allow admin full access to interview templates" ON public.interview_subject_templates
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  
  -- Grant permissions
  GRANT SELECT ON public.interview_subject_templates TO anon;
  GRANT ALL ON public.interview_subject_templates TO authenticated;
  
END $$;

SELECT 'interview_subject_templates schema fix completed - all required columns ensured' AS status;