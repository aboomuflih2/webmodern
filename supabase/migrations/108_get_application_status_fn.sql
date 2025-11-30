CREATE OR REPLACE FUNCTION public.normalize_mobile(mobile TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT RIGHT(REGEXP_REPLACE(COALESCE(mobile, ''), '\D', '', 'g'), 10);
$$;

CREATE OR REPLACE FUNCTION public.get_application_status(app_number TEXT, mobile TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_app_row RECORD;
  v_application_type TEXT;
  v_academic_year TEXT;
  v_interview_marks JSONB := '[]'::JSONB;
  v_input_mobile_norm TEXT := public.normalize_mobile(mobile);
BEGIN
  IF COALESCE(app_number, '') = '' OR v_input_mobile_norm = '' THEN
    RETURN jsonb_build_object('error', 'Application number and mobile number are required');
  END IF;

  WITH kg AS (
    SELECT id, application_number, mobile_number, full_name, status, interview_date, interview_time, created_at
    FROM public.kg_std_applications
    WHERE application_number = app_number
  ),
  p1 AS (
    SELECT id, application_number, mobile_number, full_name, status, interview_date, interview_time, created_at
    FROM public.plus_one_applications
    WHERE application_number = app_number
  ),
  found AS (
    SELECT *, 'kg_std'::TEXT AS application_type FROM kg
    UNION ALL
    SELECT *, 'plus_one'::TEXT AS application_type FROM p1
  )
  SELECT * INTO v_app_row FROM found LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Application not found');
  END IF;

  IF public.normalize_mobile(v_app_row.mobile_number) <> v_input_mobile_norm THEN
    RETURN jsonb_build_object('error', 'Mobile number does not match this application');
  END IF;

  v_application_type := v_app_row.application_type;

  SELECT academic_year INTO v_academic_year
  FROM public.admission_forms
  WHERE form_type = v_application_type
  LIMIT 1;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'subject_name', t.subject_name,
        'marks_obtained', sm.marks,
        'max_marks', t.max_marks,
        'display_order', t.display_order
      ) ORDER BY t.display_order
    ),
    '[]'::JSONB
  ) INTO v_interview_marks
  FROM public.interview_subject_templates t
  LEFT JOIN public.interview_subjects sm
    ON sm.application_id = v_app_row.id
   AND sm.application_type = v_application_type
   AND sm.subject_name = t.subject_name
  WHERE t.form_type = v_application_type
    AND t.is_active = TRUE;

  IF v_interview_marks = '[]'::JSONB THEN
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'subject_name', s.subject_name,
          'marks_obtained', s.marks,
          'max_marks', 25,
          'display_order', rn
        )
      ),
      '[]'::JSONB
    ) INTO v_interview_marks
    FROM (
      SELECT s.subject_name, s.marks, ROW_NUMBER() OVER (ORDER BY s.subject_name) AS rn
      FROM public.interview_subjects s
      WHERE s.application_id = v_app_row.id
        AND s.application_type = v_application_type
    ) s;
  END IF;

  RETURN jsonb_build_object(
    'application', to_jsonb(v_app_row),
    'applicationType', v_application_type,
    'academicYear', v_academic_year,
    'interviewMarks', v_interview_marks
  );
END;
$$;
