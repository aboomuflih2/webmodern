## Problems Observed
- Logs show two failures during status lookup:
  - Missing column: `child_name` in `kg_std_applications`.
  - Aggregate error: `t.display_order must appear in GROUP BY or be used in an aggregate` in SQL RPC.
- Frontend expects `application.full_name`; KG table historically used `child_name`, causing mismatch between +1 and KG.

## Decisions
- Canonicalize on `full_name` across both forms (KG & +1).
- Keep backward compatibility by adding a lightweight alias `child_name` in KG (generated column) so any legacy code still works.
- Fix RPC aggregation ordering using `ORDER BY` inside `jsonb_agg`.

## Database Changes
1. Add alias column `child_name` on KG table pointing to `full_name` (safe, non-breaking):
```
ALTER TABLE public.kg_std_applications
  ADD COLUMN IF NOT EXISTS child_name text GENERATED ALWAYS AS (full_name) STORED;
```
2. Ensure `full_name` exists and populated on KG:
```
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='kg_std_applications' AND column_name='full_name'
  ) THEN
    ALTER TABLE public.kg_std_applications ADD COLUMN full_name text;
    UPDATE public.kg_std_applications SET full_name = COALESCE(full_name, child_name);
  END IF;
END $$;
```
3. Fix interview marks aggregation ordering in the SQL RPC (`public.get_application_status`):
```
-- Replace the marks aggregation block with ordered aggregation
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
```
4. Fallback marks block remains unchanged; no `ORDER BY` needed there.

## Edge Function Alignment
- Keep returning `application.full_name` for both forms.
- Continue normalizing mobile (last 10 digits) and avoid strict equality failures.

## Frontend Alignment
- No UI changes required; `ApplicationTracking.tsx` already reads `application.full_name` and has SQL RPC fallback.

## Verification Plan
- Run migrations to add the alias and fix RPC ordering.
- Redeploy the Edge Function and re-create the SQL function.
- Test tracking for KG and +1 applications with various mobile formats; verify no errors and ordered marks.

## Request for Confirmation
Proceed with the above changes to unify names and fix the RPC ordering? I will apply the migrations, update the SQL function, redeploy, and validate end-to-end. 