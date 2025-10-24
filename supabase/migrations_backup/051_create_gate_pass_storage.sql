-- Create storage bucket for gate pass documents
-- Note: Storage bucket creation should be done via Supabase Dashboard or CLI
-- This migration only handles the database table changes

-- The storage bucket 'gate-pass-documents' should be created manually in Supabase Dashboard
-- with the following settings:
-- - Name: gate-pass-documents
-- - Public: false
-- - File size limit: 10MB
-- - Allowed MIME types: image/*, application/pdf

-- Add id_proof_document_path column to gate_pass_requests table
ALTER TABLE public.gate_pass_requests 
ADD COLUMN id_proof_document_path TEXT;

-- Add comment for the new column
COMMENT ON COLUMN public.gate_pass_requests.id_proof_document_path IS 'Path to the uploaded ID proof document in storage';