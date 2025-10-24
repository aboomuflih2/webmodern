-- Fix RLS policies for school_stats table to use proper admin checking
-- This migration updates school_stats to use the is_admin() function

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin full access" ON school_stats;
DROP POLICY IF EXISTS "Public read access" ON school_stats;

-- Create new policies using the is_admin() function
CREATE POLICY "Allow public read access to school_stats" ON school_stats
  FOR SELECT USING (true);

CREATE POLICY "Allow admin full access to school_stats" ON school_stats
  FOR ALL USING (is_admin());

-- Grant necessary permissions to authenticated users
GRANT ALL ON school_stats TO authenticated;
GRANT ALL ON school_stats TO anon;

-- Grant usage on sequences if any
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Test the policy
SELECT 'School stats RLS policies updated successfully' as status;