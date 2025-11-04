-- Fix RLS policies for academic_programs table to allow authenticated users to insert
-- This allows the admin panel to work properly

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Allow admin full access" ON academic_programs;

-- Create new policies that allow authenticated users to manage academic programs
CREATE POLICY "Allow authenticated users full access" ON academic_programs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Keep the public read access policy
-- (Allow public read access policy already exists)