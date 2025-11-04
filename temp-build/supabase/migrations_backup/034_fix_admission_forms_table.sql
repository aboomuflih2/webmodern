-- Align admission_forms table to configuration schema used by the app

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'admission_forms'
  ) THEN
    -- Preserve legacy table if it doesn't match expected columns
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'admission_forms' AND column_name = 'student_name'
    ) THEN
      ALTER TABLE public.admission_forms RENAME TO admission_forms_legacy;
    END IF;
  END IF;
END $$;

-- Create config table if not exists
CREATE TABLE IF NOT EXISTS public.admission_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type text NOT NULL CHECK (form_type IN ('kg_std','plus_one')),
  is_active boolean NOT NULL DEFAULT false,
  academic_year text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure unique row per form_type
CREATE UNIQUE INDEX IF NOT EXISTS ux_admission_forms_form_type ON public.admission_forms(form_type);

-- Seed rows if missing
INSERT INTO public.admission_forms (form_type, is_active, academic_year)
SELECT 'kg_std', false, ''
WHERE NOT EXISTS (SELECT 1 FROM public.admission_forms WHERE form_type='kg_std');

INSERT INTO public.admission_forms (form_type, is_active, academic_year)
SELECT 'plus_one', false, ''
WHERE NOT EXISTS (SELECT 1 FROM public.admission_forms WHERE form_type='plus_one');

-- RLS
ALTER TABLE public.admission_forms ENABLE ROW LEVEL SECURITY;

-- Public read (for showing availability on public site)
DROP POLICY IF EXISTS "Allow public read admission forms" ON public.admission_forms;
CREATE POLICY "Allow public read admission forms" ON public.admission_forms
  FOR SELECT USING (true);

-- Admin full access
DROP POLICY IF EXISTS "Allow admin full access to admission_forms" ON public.admission_forms;
CREATE POLICY "Allow admin full access to admission_forms" ON public.admission_forms
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

GRANT SELECT ON public.admission_forms TO anon;
GRANT ALL ON public.admission_forms TO authenticated;

SELECT 'admission_forms table aligned' AS status;

