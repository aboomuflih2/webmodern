-- Fix gate pass RLS policies to allow anonymous submissions

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public gate pass submissions" ON gate_pass_requests;
DROP POLICY IF EXISTS "Admin full access to gate pass requests" ON gate_pass_requests;
DROP POLICY IF EXISTS "Users can view own submissions" ON gate_pass_requests;

-- Create new permissive policy for anonymous insertions
CREATE POLICY "Allow anonymous gate pass submissions" ON gate_pass_requests
    FOR INSERT TO anon
    WITH CHECK (true);

-- Create policy for authenticated users to insert
CREATE POLICY "Allow authenticated gate pass submissions" ON gate_pass_requests
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Create policy for admin access (full access for authenticated users)
CREATE POLICY "Admin full access" ON gate_pass_requests
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create policy for users to view their own submissions
CREATE POLICY "Users view own submissions" ON gate_pass_requests
    FOR SELECT TO authenticated
    USING (email = auth.jwt() ->> 'email');

-- Grant necessary permissions
GRANT INSERT ON gate_pass_requests TO anon;
GRANT SELECT ON gate_pass_requests TO anon;
GRANT ALL PRIVILEGES ON gate_pass_requests TO authenticated;

-- Add missing column for document path if it doesn't exist
ALTER TABLE gate_pass_requests ADD COLUMN IF NOT EXISTS id_proof_document_path TEXT;

-- Create index for document path
CREATE INDEX IF NOT EXISTS idx_gate_pass_document_path ON gate_pass_requests(id_proof_document_path);

-- Confirm the fix
SELECT 'Gate pass RLS policies fixed successfully' as status;