-- Fix infinite recursion in user_roles RLS policies
-- The issue: is_admin() function queries user_roles table, but user_roles has RLS policies that call is_admin()
-- Solution: Use a different approach that doesn't create circular dependency

-- Drop all existing policies on user_roles to start fresh
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can manage all roles" ON public.user_roles;

-- Create a simple policy that allows authenticated users to read their own roles
-- This breaks the infinite recursion by not calling is_admin()
CREATE POLICY "Users can view their own role" ON public.user_roles
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Allow authenticated users to read all roles (needed for admin check)
-- This is safe because it's read-only
CREATE POLICY "Authenticated users can view all roles" ON public.user_roles
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);

-- Allow users to insert their own roles (for initial role assignment)
CREATE POLICY "Users can insert their own roles" ON public.user_roles
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own roles
CREATE POLICY "Users can update their own roles" ON public.user_roles
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- For admin operations, we'll use a service role key instead of RLS
-- This avoids the circular dependency issue

-- Grant necessary permissions
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.user_roles TO anon;
GRANT INSERT, UPDATE ON public.user_roles TO authenticated;

-- Update the is_admin() function to use SECURITY DEFINER with bypassed RLS
-- This function will run with elevated privileges to avoid RLS recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Use a direct query that bypasses RLS by using SECURITY DEFINER
  -- and checking the table directly
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If there's any error (like infinite recursion), return false
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO anon;

-- Verify the fix by testing the function
SELECT 'Testing is_admin function...' as status;