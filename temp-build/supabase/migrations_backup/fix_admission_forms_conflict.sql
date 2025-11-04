-- Fix admission forms RLS conflict
-- This migration resolves the mutual exclusivity between form submission and management
-- by properly configuring RLS policies for both anonymous users and admins

-- Drop all conflicting policies to start fresh
DROP POLICY IF EXISTS "Allow public to submit KG STD forms" ON kg_std_applications;
DROP POLICY IF EXISTS "Allow public to submit Plus One forms" ON plus_one_applications;
DROP POLICY IF EXISTS "Allow public to read form settings" ON admission_forms;
DROP POLICY IF EXISTS "Allow anonymous insert" ON kg_std_applications;
DROP POLICY IF EXISTS "Allow anonymous insert" ON plus_one_applications;
DROP POLICY IF EXISTS "Public can submit kg_std applications" ON kg_std_applications;
DROP POLICY IF EXISTS "Public can submit plus_one applications" ON plus_one_applications;
DROP POLICY IF EXISTS "Allow admin full access to kg_std" ON kg_std_applications;
DROP POLICY IF EXISTS "Allow admin full access to plus_one" ON plus_one_applications;
DROP POLICY IF EXISTS "Allow admin full access to admission_forms" ON admission_forms;
DROP POLICY IF EXISTS "Public read access" ON kg_std_applications;
DROP POLICY IF EXISTS "Public read access" ON plus_one_applications;
DROP POLICY IF EXISTS "Admin full access" ON kg_std_applications;
DROP POLICY IF EXISTS "Admin full access" ON plus_one_applications;
DROP POLICY IF EXISTS "Admin full access" ON admission_forms;

-- Ensure RLS is enabled on all tables
ALTER TABLE kg_std_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE plus_one_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_forms ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to roles
-- Anonymous users need INSERT and SELECT permissions
GRANT SELECT, INSERT ON kg_std_applications TO anon;
GRANT SELECT, INSERT ON plus_one_applications TO anon;
GRANT SELECT ON admission_forms TO anon;

-- Authenticated users need full access
GRANT ALL ON kg_std_applications TO authenticated;
GRANT ALL ON plus_one_applications TO authenticated;
GRANT ALL ON admission_forms TO authenticated;

-- Create unified RLS policies that work for both scenarios

-- 1. KG STD Applications policies
-- Allow anonymous users to insert applications
CREATE POLICY "anon_insert_kg_std" ON kg_std_applications
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users (admins) full access
CREATE POLICY "admin_full_access_kg_std" ON kg_std_applications
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow public read access for application tracking
CREATE POLICY "public_read_kg_std" ON kg_std_applications
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 2. Plus One Applications policies
-- Allow anonymous users to insert applications
CREATE POLICY "anon_insert_plus_one" ON plus_one_applications
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users (admins) full access
CREATE POLICY "admin_full_access_plus_one" ON plus_one_applications
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow public read access for application tracking
CREATE POLICY "public_read_plus_one" ON plus_one_applications
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. Admission Forms policies (for form management)
-- Allow anonymous users to read form settings (to check if forms are active)
CREATE POLICY "anon_read_admission_forms" ON admission_forms
  FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users (admins) full access for management
CREATE POLICY "admin_full_access_admission_forms" ON admission_forms
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Verify the policies are created correctly
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('kg_std_applications', 'plus_one_applications', 'admission_forms')
ORDER BY tablename, policyname;

SELECT 'Admission forms RLS conflict resolved - both submission and management should work' AS status;