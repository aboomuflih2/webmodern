## Summary
Job application inserts fail with 400 due to schema mismatch (e.g., "Could not find 'application_number' column"). We will align the frontend insert payload to the live legacy schema, remove non-existent fields, and add robust mapping from form inputs to required legacy columns.

## Findings
- Error: PostgREST 400 with message "Could not find the 'application_number' column of 'job_applications' in the schema cache" indicates the column does not exist in the live DB.
- Generated Supabase types show legacy shape for `public.job_applications.Insert`: requires `designation`, `district`, `email`, `mobile`, `name`, `pincode`, `place`, `post_office` (non-optional). See src/integrations/supabase/types.ts:934–951.
- Current payload includes modern fields (`application_number`, `full_name`, `phone`, `qualifications`, etc.) causing rejection.

## Plan
### Frontend Insert Alignment
1. Update `src/hooks/useJobApplications.ts` `submitApplication` to construct a legacy-compatible payload:
   - Required: `name`, `email`, `mobile`, `designation`, `district`, `place`, `post_office`, `pincode`.
   - Optional: `status` (default `'pending'`), `subject_specification` (from `subject`), `specify_other` (from `other_designation`), `cv_file_path` (uploaded file path), `cv_file_name`.
   - Remove modern-only fields from the insert (`application_number`, `full_name`, `phone`, `position`, `qualifications`, `cv_file`, `cover_letter`, etc.).
2. Derive address parts for required fields:
   - Parse `formData.address` to extract `place`, `post_office`, and `pincode`.
   - Simple rules: `pincode` as trailing 6-digit number; `post_office` from segments containing `PO`/`Post` keywords; `place` as first non-empty segment.
   - Fallback to empty strings if parsing fails (keeps insert valid if DB doesn't enforce more constraints).
3. Keep CV upload with `cv-uploads` and continue on failure. Insert only `cv_file_path`/`cv_file_name`.
4. Remove the adaptive retry loop (or broaden the regex) since the legacy payload should match the live schema; optionally retain a guard to strip any unexpected columns if present.

### Types and Admin
5. Regenerate Supabase types from the live DB to remove linter overload errors and include custom RPCs (optional but recommended). Until then, keep minimal safe casts around `insert`/`rpc`.
6. No RLS changes needed for inserts (we already ensured anon insert policy). Focus is schema acceptance.

### Verification
7. Submit the form with and without CV:
   - Expect 200 insert; success toast appears; Admin → Job Applications list updates.
   - Browser console should not show "Could not find column" errors.
8. If DB enforces NOT NULL on additional legacy fields, add sensible defaults or extend parser.

## References
- Types: `src/integrations/supabase/types.ts:934–951`
- Current insert flow: `src/hooks/useJobApplications.ts:78–159`
- CV upload: `src/hooks/useJobApplications.ts:85–93`
- Admin download fallback: `src/hooks/useJobApplications.ts:203–217`