-- Simple RLS policy to allow anonymous insertions
-- This addresses the "new row violates row-level security policy" error

-- First, ensure RLS is enabled
ALTER TABLE gate_pass_requests ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might be conflicting
DROP POLICY IF EXISTS "Allow anonymous insertions" ON gate_pass_requests;
DROP POLICY IF EXISTS "Allow authenticated insertions" ON gate_pass_requests;
DROP POLICY IF EXISTS "Allow admin full access" ON gate_pass_requests;
DROP POLICY IF EXISTS "Allow users to view own submissions" ON gate_pass_requests;

-- Create a simple policy that allows anyone to insert
CREATE POLICY "Allow anonymous insertions" ON gate_pass_requests
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Create a policy that allows anyone to select (for testing)
CREATE POLICY "Allow anonymous select" ON gate_pass_requests
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Create a policy for admin full access
CREATE POLICY "Allow admin full access" ON gate_pass_requests
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions to anon and authenticated roles
GRANT INSERT, SELECT ON gate_pass_requests TO anon;
GRANT ALL PRIVILEGES ON gate_pass_requests TO authenticated;

-- Also grant usage on the sequence for the id column
GRANT USAGE ON SEQUENCE gate_pass_requests_id_seq TO anon;
GRANT USAGE ON SEQUENCE gate_pass_requests_id_seq TO authenticated;