## Summary
- Investigate and fix why job application submissions are not appearing in the dashboard or database.
- Root causes identified: CV upload to a restricted bucket blocks insert; dashboard read limited by RLS.
- Implement code and SQL policy updates, then verify end-to-end.

## Current Findings
- Frontend form: `src/pages/Careers.tsx` submits via `useJobApplications.submitApplication` (src/hooks/useJobApplications.ts:77–208).
- Submission flow uploads CV to `document-uploads` bucket (src/hooks/useJobApplications.ts:125–131) and inserts into `job_applications` with an anon Supabase client (src/hooks/useJobApplications.ts:164–167).
- Bucket `document-uploads` is private; only `authenticated` can upload (supabase/migrations/011_create_storage_buckets.sql:71–82). Public users submitting the form are `anon`, so uploads fail and the function throws, preventing DB insert.
- There is a dedicated `cv-uploads` bucket and policies in backup migrations allowing `anon` INSERT (agent findings). The code also has a helper defaulting to `cv-uploads` (src/hooks/useJobApplications.ts:410–478), but the submit path still uses `document-uploads`.
- Dashboard reads `job_applications` via the default client (src/hooks/useJobApplications.ts:19–23); current RLS allows SELECT only for admins (supabase/migrations/072_create_missing_tables.sql:102–108). If the viewing user is not recognized as admin, the dashboard appears empty even if rows exist.

## Fix Plan
### Frontend
- Switch CV upload in `submitApplication` to `cv-uploads` to match permissive policies and the `useFileUpload` helper.
- Make CV upload non-blocking:
  - Attempt upload first; on failure, log and continue with `cv_file = null`.
  - Show a toast indicating the CV was not uploaded but the application was submitted.
- Keep insertion via anon client as-is, since `Public can insert job applications` policy exists.
- Optional small alignment: use `useFileUpload.uploadFile` to centralize validation and bucket usage.

### Supabase Policies
- Ensure `cv-uploads` bucket exists and has policies:
  - `anon` INSERT for `bucket_id = 'cv-uploads'`.
  - `authenticated` SELECT/DELETE for `bucket_id = 'cv-uploads'`.
- If not present in the live DB, add a migration to create `cv-uploads` and attach the policies drawn from the backup scripts.
- Keep `job_applications` RLS allowing public INSERT; do not broaden SELECT globally.

### Dashboard Read
- Verify the admin role is recognized:
  - The admin SELECT policy uses `EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')` (supabase/migrations/072_create_missing_tables.sql:102–108).
  - Confirm the admin user has a row in `public.user_roles` with `role = 'admin'`.
- If needed, add/confirm a stable `is_admin()` function and adjust policies to use it consistently.

## Verification
- Run locally and submit with and without a CV:
  - Without CV: should insert and show Success toast; row visible in dashboard when logged in as admin.
  - With CV: upload to `cv-uploads` should succeed for public users; insert should include `cv_file` path.
- Check the dashboard `src/pages/admin/JobApplications.tsx` list reflects the new rows.
- Spot-check Supabase logs or console errors from `submitApplication` for failures.

## Risks and Mitigations
- Changing bucket name could orphan existing files in `document-uploads`; leave old files and keep dashboard download compatible.
- Do not relax SELECT RLS beyond admin to avoid leaking applicant data.

## Implementation Steps
1. Update `src/hooks/useJobApplications.ts` to use `cv-uploads` and handle upload failures gracefully.
2. Optionally refactor to use `useFileUpload.uploadFile(...)` for CV.
3. Add/confirm Supabase migration creating `cv-uploads` with anon insert + authenticated read/delete policies.
4. Verify admin role in `public.user_roles`; seed if missing.
5. End-to-end test: form submit, DB insert, dashboard listing, CV download.

## Notes
- Key references:
  - `src/hooks/useJobApplications.ts`:125–139, 164–190, 246–278
  - `src/pages/Careers.tsx`:103–131
  - `supabase/migrations/011_create_storage_buckets.sql`:71–82
  - `supabase/migrations/072_create_missing_tables.sql`:98–108
- Assumption: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correctly set in the environment.