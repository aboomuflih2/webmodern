-- Fix infinite recursion in user_roles RLS policy
-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

-- Create new policies that avoid circular dependency
-- Policy 1: Users can view their own roles (no recursion)
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Policy 2: Allow service role to manage all roles (for admin operations)
CREATE POLICY "Service role can manage all roles" ON user_roles
    FOR ALL USING (auth.role() = 'service_role');

-- Policy 3: Allow authenticated users to read all roles (needed for admin checks)
-- This is safe because we're only allowing SELECT operations
CREATE POLICY "Authenticated users can read roles" ON user_roles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy 4: Only allow inserts/updates/deletes through service role or specific admin function
CREATE POLICY "Restrict modifications to service role" ON user_roles
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Restrict updates to service role" ON user_roles
    FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Restrict deletes to service role" ON user_roles
    FOR DELETE USING (auth.role() = 'service_role');