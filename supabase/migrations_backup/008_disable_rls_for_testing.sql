-- Temporarily disable RLS for testing admin functionality
-- This allows authenticated users to perform all operations

-- Disable RLS on main tables
ALTER TABLE public.hero_slides DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admission_forms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to authenticated users
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant read permissions to anon users
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Create admin user for testing
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
VALUES (
  'c323b782-1886-447d-be4e-13cefde8afc0',
  'admin',
  NOW(),
  NOW()
);

SELECT 'RLS disabled for testing - admin functionality should work' as status;