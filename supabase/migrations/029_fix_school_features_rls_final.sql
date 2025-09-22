-- Fix school_features RLS policies
-- This migration fixes the School Features Manager form submission issue

-- Drop all existing policies on school_features
DROP POLICY IF EXISTS "Public read access" ON school_features;
DROP POLICY IF EXISTS "Admin full access" ON school_features;
DROP POLICY IF EXISTS "Allow public read access to school_features" ON school_features;
DROP POLICY IF EXISTS "Allow admin full access to school_features" ON school_features;
DROP POLICY IF EXISTS "school_features_select_policy" ON school_features;
DROP POLICY IF EXISTS "school_features_insert_policy" ON school_features;
DROP POLICY IF EXISTS "school_features_update_policy" ON school_features;
DROP POLICY IF EXISTS "school_features_delete_policy" ON school_features;
DROP POLICY IF EXISTS "school_features_all_authenticated" ON school_features;
DROP POLICY IF EXISTS "school_features_read_all" ON school_features;
DROP POLICY IF EXISTS "school_features_public_read" ON school_features;
DROP POLICY IF EXISTS "school_features_authenticated_all" ON school_features;
DROP POLICY IF EXISTS "school_features_auth_all" ON school_features;

-- Create new policies using is_admin() function
-- Allow public read access
CREATE POLICY "Allow public read access to school_features" ON school_features
  FOR SELECT TO anon, authenticated
  USING (true);

-- Allow admin full access using is_admin() function
CREATE POLICY "Allow admin full access to school_features" ON school_features
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Grant necessary permissions
GRANT SELECT ON school_features TO anon;
GRANT ALL ON school_features TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE school_features_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE school_features_id_seq TO anon;

-- Test the is_admin() function
SELECT 'is_admin() function test:' as test, is_admin() as result;