-- Add missing form_type column to interview_subject_templates table
-- This fixes the error: column interview_subject_template.form_type does not exist

DO $$
BEGIN
  -- Check if form_type column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'interview_subject_templates' 
    AND column_name = 'form_type'
  ) THEN
    -- Add the form_type column
    ALTER TABLE public.interview_subject_templates 
    ADD COLUMN form_type text;
    
    -- Add the constraint after adding the column
    ALTER TABLE public.interview_subject_templates 
    ADD CONSTRAINT check_form_type CHECK (form_type IN ('kg_std','plus_one'));
    
    -- Set default values for existing records (if any)
    -- This is a safe operation since we're adding a new column
    UPDATE public.interview_subject_templates 
    SET form_type = 'kg_std' 
    WHERE form_type IS NULL;
    
    -- Make the column NOT NULL after setting default values
    ALTER TABLE public.interview_subject_templates 
    ALTER COLUMN form_type SET NOT NULL;
    
    -- Create unique index for form_type and subject_name combination
    CREATE UNIQUE INDEX IF NOT EXISTS ux_interview_templates_form_subject 
    ON public.interview_subject_templates(form_type, subject_name);
    
    RAISE NOTICE 'Added form_type column to interview_subject_templates table';
  ELSE
    RAISE NOTICE 'form_type column already exists in interview_subject_templates table';
  END IF;
  
  -- Also ensure display_order column exists
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
END $$;

SELECT 'Form type column migration completed' AS status;