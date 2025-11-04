-- Fix RLS policies to allow admin users to perform CRUD operations
-- This migration creates proper RLS policies that check for admin role

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admin full access to news_posts" ON news_posts;
DROP POLICY IF EXISTS "Allow admin full access to hero_slides" ON hero_slides;
DROP POLICY IF EXISTS "Allow admin full access to academic_programs" ON academic_programs;
DROP POLICY IF EXISTS "Allow admin full access to testimonials" ON testimonials;
DROP POLICY IF EXISTS "Allow admin full access to contact_submissions" ON contact_submissions;

-- Create function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the current user has admin role
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create comprehensive RLS policies for news_posts
CREATE POLICY "Allow public read access to published news_posts" ON news_posts
  FOR SELECT USING (is_published = true);

CREATE POLICY "Allow admin full access to news_posts" ON news_posts
  FOR ALL USING (is_admin());

-- Create comprehensive RLS policies for hero_slides
CREATE POLICY "Allow public read access to active hero_slides" ON hero_slides
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow admin full access to hero_slides" ON hero_slides
  FOR ALL USING (is_admin());

-- Create comprehensive RLS policies for academic_programs
CREATE POLICY "Allow public read access to academic_programs" ON academic_programs
  FOR SELECT USING (true);

CREATE POLICY "Allow admin full access to academic_programs" ON academic_programs
  FOR ALL USING (is_admin());

-- Create comprehensive RLS policies for testimonials
CREATE POLICY "Allow public read access to testimonials" ON testimonials
  FOR SELECT USING (true);

CREATE POLICY "Allow admin full access to testimonials" ON testimonials
  FOR ALL USING (is_admin());

-- Create comprehensive RLS policies for contact_submissions
CREATE POLICY "Allow admin full access to contact_submissions" ON contact_submissions
  FOR ALL USING (is_admin());

-- Grant necessary permissions to authenticated users
GRANT ALL ON news_posts TO authenticated;
GRANT ALL ON hero_slides TO authenticated;
GRANT ALL ON academic_programs TO authenticated;
GRANT ALL ON testimonials TO authenticated;
GRANT ALL ON contact_submissions TO authenticated;
GRANT ALL ON user_roles TO authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure the is_admin function can be called by authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO anon;

-- Test the admin function
SELECT 'Admin function created successfully' as status;