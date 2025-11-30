DROP POLICY IF EXISTS "Allow public read admission forms" ON public.admission_forms;
DROP POLICY IF EXISTS "Allow admin full access to admission_forms" ON public.admission_forms;

ALTER TABLE public.admission_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admission_forms_public_read" ON public.admission_forms
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "admission_forms_admin_full_access" ON public.admission_forms
  FOR ALL TO authenticated
  USING (
    is_admin() OR COALESCE(((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role') = 'admin', false)
  )
  WITH CHECK (
    is_admin() OR COALESCE(((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role') = 'admin', false)
  );

GRANT SELECT ON public.admission_forms TO anon;
GRANT ALL ON public.admission_forms TO authenticated;
