-- Fix user_roles table INSERT policy
-- Allow authenticated users to insert their own roles

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;

-- Create INSERT policy for users to insert their own roles
CREATE POLICY "Users can insert their own roles" ON public.user_roles
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Create UPDATE policy for users to update their own roles
CREATE POLICY "Users can update their own roles" ON public.user_roles
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create policy for admins to manage all user roles
CREATE POLICY "Admins can manage all user roles" ON public.user_roles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin'
        )
    );

-- Grant necessary permissions
GRANT INSERT, UPDATE ON public.user_roles TO authenticated;

-- Insert admin role for the new admin user if it doesn't exist
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
SELECT '4272e82d-acfc-4a3b-9e2b-10772c06aa2c', 'admin', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = '4272e82d-acfc-4a3b-9e2b-10772c06aa2c'
);

-- Verify the admin user role
SELECT user_id, role, created_at, updated_at 
FROM public.user_roles 
WHERE user_id = '4272e82d-acfc-4a3b-9e2b-10772c06aa2c';