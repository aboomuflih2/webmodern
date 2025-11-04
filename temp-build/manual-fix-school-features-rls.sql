-- Manual fix for School Features RLS policies
-- Run this script in Supabase SQL Editor to fix the RLS policy issues

-- Step 1: Create or replace the is_admin function with proper implementation
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check user metadata for admin role
  RETURN COALESCE(
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin',
    false
  );
END;
$$;

-- Step 2: Drop all existing policies on school_features
DROP POLICY IF EXISTS "Admin full access" ON school_features;
DROP POLICY IF EXISTS "Public read access" ON school_features;
DROP POLICY IF EXISTS "Allow public read access to school_features" ON school_features;
DROP POLICY IF EXISTS "Allow admin full access to school_features" ON school_features;
DROP POLICY IF EXISTS "school_features_select_policy" ON school_features;
DROP POLICY IF EXISTS "school_features_insert_policy" ON school_features;
DROP POLICY IF EXISTS "school_features_update_policy" ON school_features;
DROP POLICY IF EXISTS "school_features_delete_policy" ON school_features;
DROP POLICY IF EXISTS "school_features_admin_policy" ON school_features;
DROP POLICY IF EXISTS "school_features_all_authenticated" ON school_features;
DROP POLICY IF EXISTS "school_features_read_all" ON school_features;
DROP POLICY IF EXISTS "school_features_public_read" ON school_features;
DROP POLICY IF EXISTS "school_features_authenticated_all" ON school_features;
DROP POLICY IF EXISTS "school_features_auth_all" ON school_features;

-- Step 3: Enable RLS on school_features table
ALTER TABLE school_features ENABLE ROW LEVEL SECURITY;

-- Step 4: Create new policies
-- Allow public read access for displaying features on the website
CREATE POLICY "school_features_public_read" ON school_features
    FOR SELECT
    USING (true);

-- Allow admin users full access (insert, update, delete)
CREATE POLICY "school_features_admin_full_access" ON school_features
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Step 5: Grant necessary permissions
GRANT SELECT ON school_features TO anon;
GRANT ALL PRIVILEGES ON school_features TO authenticated;

-- Step 6: Test the is_admin function (this will show the result)
SELECT 
    'Testing is_admin function:' as test_description,
    is_admin() as is_admin_result,
    auth.uid() as current_user_id,
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' as user_role;

-- Step 7: Verify policies are created
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
WHERE tablename = 'school_features'
ORDER BY policyname;

-- Step 8: Check table permissions
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'school_features'
    AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;

-- Instructions:
-- 1. Copy and paste this entire script into Supabase SQL Editor
-- 2. Run the script while logged in as an admin user
-- 3. Check the results of the SELECT statements at the end
-- 4. The is_admin() function should return true for admin users
-- 5. You should see the two new policies created
-- 6. You should see the permissions granted to anon and authenticated roles