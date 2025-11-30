## Problem Overview
- Error: `42501 new row violates row-level security policy for table "admission_forms"` when toggling activate/deactivate.
- Root cause: RLS policies require admin; the active session isn’t satisfying the admin predicate during INSERT/UPDATE (including UPSERT).
- Impact: Public visibility buttons rely on `admission_forms.is_active`, so activation failure blocks the entire workflow.

## Diagnosis Steps (Read‑Only)
1. Inspect current policies:
   - Query `pg_policies` for `public.admission_forms` to confirm active `USING/WITH CHECK` conditions.
2. Confirm current `is_admin()` definition deployed (there are multiple versions in migrations):
   - One checks `user_roles` (supabase/migrations/006_fix_admin_rls_policies.sql).
   - Another checks JWT `user_metadata.role` (manual-fix-frontend-rls.sql:1–15).
3. Verify the session used by the admin UI has `user_metadata.role='admin'` and is authenticated.
4. Confirm table rows exist for both `form_type`: `kg_std`, `plus_one` (034 migration seeds them).

## Database Policy Fix
- Keep public read, add explicit admin INSERT and UPDATE policies that accept either admin source (function or JWT):
- SQL to apply:
```
ALTER TABLE public.admission_forms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admission_forms_public_read" ON public.admission_forms;
CREATE POLICY "admission_forms_public_read" ON public.admission_forms FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admission_forms_admin_insert" ON public.admission_forms;
CREATE POLICY "admission_forms_admin_insert" ON public.admission_forms FOR INSERT TO authenticated WITH CHECK (
  is_admin() OR COALESCE(((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role') = 'admin', false)
);
DROP POLICY IF EXISTS "admission_forms_admin_update" ON public.admission_forms;
CREATE POLICY "admission_forms_admin_update" ON public.admission_forms FOR UPDATE TO authenticated USING (
  is_admin() OR COALESCE(((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role') = 'admin', false)
) WITH CHECK (
  is_admin() OR COALESCE(((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role') = 'admin', false)
);
```
- Optional: unify `is_admin()` definition to check both `user_roles` and JWT claim to avoid environment drift.

## Frontend Auth Alignment
- Ensure the admin claim is present before writing:
  - In `src/hooks/useAuth.ts:68–96`, after confirming admin via `user_roles`, update the user metadata to `{ role: 'admin' }` and refresh the session.
- Ensure all admin writes call a helper before Supabase writes (Admission forms page already does this):
  - `src/pages/admin/AdmissionForms.tsx:28–35` define `ensureAdminRole()`.
  - Call it before upsert in `updateFormStatus` (`src/pages/admin/AdmissionForms.tsx:52–56`) and `updateAcademicYear` (`src/pages/admin/AdmissionForms.tsx:88–92`).

## Admin Toggles (Activation)
- Use robust writes:
  - Replace chained `update(...).eq('form_type', ...)` with `upsert({ form_type, is_active }, { onConflict: 'form_type' })` and similarly for `academic_year`.
  - Locations: `src/pages/admin/AdmissionForms.tsx:52–56, 88–92`.

## Public Visibility
- Public "Apply Now" buttons depend on `admission_forms` SELECT (allowed by public policy):
  - `src/components/admissions/AdmissionsModal.tsx:36–55` reads statuses.
  - Buttons only show when `is_active` is true (`src/components/admissions/AdmissionsModal.tsx:127–158`).

## Review & Interview Workflow
- Review list and bulk actions: `src/pages/admin/AdmissionApplications.tsx`.
- Individual application view and status changes: `src/pages/admin/ApplicationDetail.tsx`.
- Interview templates: `src/pages/admin/InterviewSettings.tsx`.
- These pages rely on admin RLS; once session admin claim is correct, they should work consistently.

## Applicant Tracking
- Tracking page hits RPCs/queries to build status and download docs: `src/pages/ApplicationTracking.tsx`.
- No write access needed; should remain unaffected by admission_forms fixes.

## Verification Plan
1. Policies: run the SQL above; confirm via `pg_policies` that INSERT/UPDATE policies exist.
2. Session: sign out and sign in as admin; verify `role: 'admin'` in `auth.jwt()`.
3. Activation: toggle KG/STD and +1 switches in `Admin → Admission Forms`; confirm no `42501` error.
4. Public visibility: open Admissions modal; see Apply buttons reflect activation immediately.
5. End-to-end: submit a test application on each form, review in admin, schedule interview, enter marks, set final status; track via application number.

## Safeguards
- No service-role keys in frontend; all writes happen under RLS.
- Policies restrict writes to authenticated admins only.
- Upsert prevents missing seed rows breaking toggles.

If you approve, I’ll apply the SQL (or a migration), refresh the session handling, and run end-to-end verification with you.