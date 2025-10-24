-- Fix RLS policies for school_features table to allow admin CRUD operations
-- Drop existing policies
DROP POLICY IF EXISTS "Admin full access" ON school_features;
DROP POLICY IF EXISTS "Public read access" ON school_features;
DROP POLICY IF EXISTS "school_features_select_policy" ON school_features;
DROP POLICY IF EXISTS "school_features_insert_policy" ON school_features;
DROP POLICY IF EXISTS "school_features_update_policy" ON school_features;
DROP POLICY IF EXISTS "school_features_delete_policy" ON school_features;

-- Enable RLS on school_features table
ALTER TABLE school_features ENABLE ROW LEVEL SECURITY;

-- Create new policies
-- Allow public read access for displaying features on the website
CREATE POLICY "school_features_select_policy" ON school_features
    FOR SELECT
    USING (true);

-- Allow all authenticated admin users full access (INSERT, UPDATE, DELETE)
CREATE POLICY "school_features_admin_policy" ON school_features
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Grant permissions to roles
GRANT SELECT ON school_features TO anon;
GRANT ALL PRIVILEGES ON school_features TO authenticated;

-- Ensure the is_admin function exists and works correctly
-- This function should already exist from previous migrations
-- but we'll verify it's working as expected
DO $$
BEGIN
    -- Test if is_admin function exists
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
        RAISE EXCEPTION 'is_admin function does not exist. Please ensure it is created in a previous migration.';
    END IF;
END $$;