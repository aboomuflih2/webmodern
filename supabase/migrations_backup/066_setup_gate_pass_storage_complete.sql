-- Complete setup for gate pass document storage
-- This migration ensures proper storage bucket configuration and RLS policies

-- First, ensure the id_proof_document_path column exists
ALTER TABLE public.gate_pass_requests 
ADD COLUMN IF NOT EXISTS id_proof_document_path TEXT;

-- Add comment for the new column
COMMENT ON COLUMN public.gate_pass_requests.id_proof_document_path IS 'Path to the uploaded ID proof document in Supabase storage';

-- Create storage bucket (if not exists) - This needs to be done via Supabase Dashboard
-- Manual steps required:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create bucket named 'gate-pass-documents'
-- 3. Set bucket as private (public: false)
-- 4. Set file size limit to 10MB
-- 5. Set allowed MIME types: image/jpeg, image/jpg, image/png, application/pdf

-- Grant storage permissions to authenticated users
-- These policies should be created in the Supabase Dashboard under Storage > Policies

-- Policy 1: Allow authenticated users to upload files
-- Name: "Authenticated users can upload gate pass documents"
-- Operation: INSERT
-- Target roles: authenticated
-- Policy definition: true

-- Policy 2: Allow users to view their own uploaded files
-- Name: "Users can view their own gate pass documents"
-- Operation: SELECT
-- Target roles: authenticated
-- Policy definition: auth.uid()::text = (storage.foldername(name))[1]

-- Policy 3: Allow admin users to view all files
-- Name: "Admin users can view all gate pass documents"
-- Operation: SELECT
-- Target roles: authenticated
-- Policy definition: auth.jwt() ->> 'role' = 'admin'

-- Policy 4: Allow admin users to delete files
-- Name: "Admin users can delete gate pass documents"
-- Operation: DELETE
-- Target roles: authenticated
-- Policy definition: auth.jwt() ->> 'role' = 'admin'

-- Update table permissions
GRANT SELECT, INSERT ON public.gate_pass_requests TO anon;
GRANT ALL PRIVILEGES ON public.gate_pass_requests TO authenticated;

-- Create index for better performance on document path queries
CREATE INDEX IF NOT EXISTS idx_gate_pass_requests_document_path 
ON public.gate_pass_requests(id_proof_document_path) 
WHERE id_proof_document_path IS NOT NULL;

SELECT 'Gate pass storage setup completed - Manual bucket creation required' as status;