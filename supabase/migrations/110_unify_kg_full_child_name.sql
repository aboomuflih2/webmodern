DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='kg_std_applications' AND column_name='full_name'
  ) THEN
    ALTER TABLE public.kg_std_applications ADD COLUMN full_name text;
    UPDATE public.kg_std_applications SET full_name = COALESCE(full_name, child_name);
  END IF;

  BEGIN
    ALTER TABLE public.kg_std_applications
      ADD COLUMN child_name text GENERATED ALWAYS AS (full_name) STORED;
  EXCEPTION WHEN duplicate_column THEN
    -- Column already exists; do nothing
    NULL;
  END;
END $$;
