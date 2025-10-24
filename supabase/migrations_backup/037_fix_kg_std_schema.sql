-- Align kg_std_applications schema to app expectations

-- Rename child_name -> full_name if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='kg_std_applications' AND column_name='child_name'
  ) THEN
    EXECUTE 'ALTER TABLE public.kg_std_applications RENAME COLUMN child_name TO full_name';
  END IF;
END $$;

-- Add missing columns
ALTER TABLE public.kg_std_applications
  ADD COLUMN IF NOT EXISTS stage text,
  ADD COLUMN IF NOT EXISTS need_madrassa boolean,
  ADD COLUMN IF NOT EXISTS previous_madrassa text,
  ADD COLUMN IF NOT EXISTS has_siblings boolean,
  ADD COLUMN IF NOT EXISTS siblings_names text;

-- Ensure status values align
ALTER TABLE public.kg_std_applications
  ALTER COLUMN status SET DEFAULT 'submitted';

-- RLS: keep as is (managed elsewhere), just ensure table has RLS enabled
ALTER TABLE public.kg_std_applications ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.kg_std_applications TO authenticated;
GRANT SELECT ON public.kg_std_applications TO anon;

SELECT 'kg_std_applications schema aligned' AS status;

