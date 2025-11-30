CREATE OR REPLACE FUNCTION public.admin_set_admission_form_active(
  p_form_type text,
  p_is_active boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    OR COALESCE(((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role') = 'admin', false)
  ) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  INSERT INTO public.admission_forms (form_type, is_active)
  VALUES (p_form_type, COALESCE(p_is_active, false))
  ON CONFLICT (form_type)
  DO UPDATE SET
    is_active = COALESCE(EXCLUDED.is_active, public.admission_forms.is_active),
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_admission_form_year(
  p_form_type text,
  p_academic_year text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    OR COALESCE(((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role') = 'admin', false)
  ) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  INSERT INTO public.admission_forms (form_type, academic_year)
  VALUES (p_form_type, COALESCE(p_academic_year, ''))
  ON CONFLICT (form_type)
  DO UPDATE SET
    academic_year = COALESCE(EXCLUDED.academic_year, public.admission_forms.academic_year),
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_admission_form_active(text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_admission_form_year(text, text) TO authenticated;
