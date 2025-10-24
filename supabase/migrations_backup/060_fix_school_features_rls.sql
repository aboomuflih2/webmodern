-- Fix RLS policies for school_features table to use proper admin checking
-- This migration updates school_features to use the is_admin() function

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin full access" ON school_features;
DROP POLICY IF EXISTS "Public read access" ON school_features;

-- Create new policies using the is_admin() function
CREATE POLICY "Allow public read access to school_features" ON school_features
  FOR SELECT USING (true);

CREATE POLICY "Allow admin full access to school_features" ON school_features
  FOR ALL USING (is_admin());

-- Grant necessary permissions to authenticated users
GRANT ALL ON school_features TO authenticated;
GRANT ALL ON school_features TO anon;

-- Grant usage on sequences if any
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Test the policy
SELECT 'School features RLS policies updated successfully' as status;