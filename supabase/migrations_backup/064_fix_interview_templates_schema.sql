-- Align interview_subject_templates schema to app expectations

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'interview_subject_templates'
  ) THEN
    -- If legacy columns exist, archive the table
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='interview_subject_templates' AND column_name='template_name'
    ) THEN
      ALTER TABLE public.interview_subject_templates RENAME TO interview_subject_templates_legacy;
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.interview_subject_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type text NOT NULL CHECK (form_type IN ('kg_std','plus_one')),
  subject_name text NOT NULL,
  max_marks integer NOT NULL DEFAULT 25,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_interview_templates_form_subject ON public.interview_subject_templates(form_type, subject_name);

ALTER TABLE public.interview_subject_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read interview templates" ON public.interview_subject_templates;
CREATE POLICY "Public read interview templates" ON public.interview_subject_templates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin full access to interview templates" ON public.interview_subject_templates;
CREATE POLICY "Allow admin full access to interview templates" ON public.interview_subject_templates
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

GRANT SELECT ON public.interview_subject_templates TO anon;
GRANT ALL ON public.interview_subject_templates TO authenticated;

SELECT 'interview templates schema aligned' AS status;

