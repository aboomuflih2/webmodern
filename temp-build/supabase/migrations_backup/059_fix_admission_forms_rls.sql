-- Fix RLS policies for admission forms to allow public submissions
-- This migration ensures anonymous users can submit admission forms

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Admin full access" ON kg_std_applications;
DROP POLICY IF EXISTS "Public read access" ON kg_std_applications;
DROP POLICY IF EXISTS "Admin full access" ON plus_one_applications;
DROP POLICY IF EXISTS "Public read access" ON plus_one_applications;

-- Create new policies for kg_std_applications
CREATE POLICY "Allow anonymous insert" ON kg_std_applications
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public read" ON kg_std_applications
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Allow admin full access" ON kg_std_applications
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new policies for plus_one_applications
CREATE POLICY "Allow anonymous insert" ON plus_one_applications
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public read" ON plus_one_applications
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Allow admin full access" ON plus_one_applications
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions to anon role
GRANT INSERT ON kg_std_applications TO anon;
GRANT SELECT ON kg_std_applications TO anon;
GRANT INSERT ON plus_one_applications TO anon;
GRANT SELECT ON plus_one_applications TO anon;

-- Grant all permissions to authenticated users
GRANT ALL ON kg_std_applications TO authenticated;
GRANT ALL ON plus_one_applications TO authenticated;

-- Ensure contact_submissions table also allows anonymous access
DROP POLICY IF EXISTS "Admin full access" ON contact_submissions;
DROP POLICY IF EXISTS "Public read access" ON contact_submissions;

CREATE POLICY "Allow anonymous insert" ON contact_submissions
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public read" ON contact_submissions
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Allow admin full access" ON contact_submissions
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT INSERT ON contact_submissions TO anon;
GRANT SELECT ON contact_submissions TO anon;
GRANT ALL ON contact_submissions TO authenticated;

-- Note: form_settings table will be created in a later migration
-- Skipping form_settings permissions for now