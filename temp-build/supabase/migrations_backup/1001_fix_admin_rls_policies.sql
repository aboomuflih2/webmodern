-- Fix RLS policies to allow proper admin access
-- This migration ensures admins can access all tables without infinite recursion

-- First, ensure the is_admin function exists and works correctly
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user has admin role
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Fix school_features RLS policies
DROP POLICY IF EXISTS "Users can view school features" ON public.school_features;
DROP POLICY IF EXISTS "Admins can manage school features" ON public.school_features;

CREATE POLICY "Users can view school features" ON public.school_features
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage school features" ON public.school_features
  FOR ALL USING (public.is_admin());

-- Fix hero_slides RLS policies
DROP POLICY IF EXISTS "Users can view hero slides" ON public.hero_slides;
DROP POLICY IF EXISTS "Admins can insert hero slides" ON public.hero_slides;
DROP POLICY IF EXISTS "Admins can update hero slides" ON public.hero_slides;
DROP POLICY IF EXISTS "Admins can delete hero_slides" ON public.hero_slides;

CREATE POLICY "Users can view hero slides" ON public.hero_slides
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage hero slides" ON public.hero_slides
  FOR ALL USING (public.is_admin());

-- Fix academic_programs RLS policies
DROP POLICY IF EXISTS "Users can view academic programs" ON public.academic_programs;
DROP POLICY IF EXISTS "Admins can manage academic programs" ON public.academic_programs;

CREATE POLICY "Users can view academic programs" ON public.academic_programs
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage academic programs" ON public.academic_programs
  FOR ALL USING (public.is_admin());

-- Fix gate_pass_requests RLS policies
DROP POLICY IF EXISTS "Users can view their own gate pass requests" ON public.gate_pass_requests;
DROP POLICY IF EXISTS "Users can create gate pass requests" ON public.gate_pass_requests;
DROP POLICY IF EXISTS "Users can update their own gate pass requests" ON public.gate_pass_requests;
DROP POLICY IF EXISTS "Admins can manage all gate pass requests" ON public.gate_pass_requests;

CREATE POLICY "Users can view their own gate pass requests" ON public.gate_pass_requests
  FOR SELECT USING (auth.uid() = student_id OR public.is_admin());

CREATE POLICY "Users can create gate pass requests" ON public.gate_pass_requests
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update their own gate pass requests" ON public.gate_pass_requests
  FOR UPDATE USING (auth.uid() = student_id AND status = 'pending');

CREATE POLICY "Admins can manage all gate pass requests" ON public.gate_pass_requests
  FOR ALL USING (public.is_admin());

-- Ensure user_roles policies are simple and don't cause recursion
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roles" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Simple admin policy for user_roles that doesn't cause recursion
CREATE POLICY "Service role can manage all user roles" ON public.user_roles
  FOR ALL USING (current_setting('role') = 'service_role');

-- Grant necessary permissions
GRANT ALL ON public.school_features TO authenticated;
GRANT ALL ON public.hero_slides TO authenticated;
GRANT ALL ON public.academic_programs TO authenticated;
GRANT ALL ON public.gate_pass_requests TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';