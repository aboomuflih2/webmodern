
-- Final fix for school_features RLS policies
-- Drop all existing policies
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

-- Create new policies
-- Allow public read access
CREATE POLICY "school_features_public_read" ON school_features
  FOR SELECT TO anon, authenticated
  USING (true);

-- Allow authenticated users full access (simplified for now)
CREATE POLICY "school_features_authenticated_all" ON school_features
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT ON school_features TO anon;
GRANT ALL ON school_features TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE school_features_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE school_features_id_seq TO anon;
    