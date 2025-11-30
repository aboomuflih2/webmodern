CREATE OR REPLACE FUNCTION public.admin_set_admission_form_status(
  p_form_type text,
  p_is_active boolean,
  p_academic_year text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    is_admin() OR COALESCE(((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role') = 'admin', false)
  ) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  INSERT INTO public.admission_forms (form_type, is_active, academic_year)
  VALUES (p_form_type, COALESCE(p_is_active, false), COALESCE(p_academic_year, ''))
  ON CONFLICT (form_type)
  DO UPDATE SET
    is_active = COALESCE(EXCLUDED.is_active, public.admission_forms.is_active),
    academic_year = COALESCE(EXCLUDED.academic_year, public.admission_forms.academic_year),
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_admission_form_status(text, boolean, text) TO authenticated;
