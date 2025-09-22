-- Add display_order column to interview_subject_templates if it doesn't exist
-- This ensures the column exists for proper ordering functionality

DO $$
BEGIN
  -- Check if display_order column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'interview_subject_templates' 
    AND column_name = 'display_order'
  ) THEN
    ALTER TABLE public.interview_subject_templates 
    ADD COLUMN display_order integer NOT NULL DEFAULT 0;
    
    -- Update existing records with proper display_order values
    WITH ordered_subjects AS (
      SELECT id, 
             ROW_NUMBER() OVER (PARTITION BY form_type ORDER BY created_at) as new_order
      FROM public.interview_subject_templates
    )
    UPDATE public.interview_subject_templates 
    SET display_order = ordered_subjects.new_order
    FROM ordered_subjects 
    WHERE public.interview_subject_templates.id = ordered_subjects.id;
    
    RAISE NOTICE 'Added display_order column to interview_subject_templates table';
  ELSE
    RAISE NOTICE 'display_order column already exists in interview_subject_templates table';
  END IF;
END $$;

SELECT 'Display order column migration completed' AS status;