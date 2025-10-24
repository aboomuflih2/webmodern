-- Fix breaking_news table permissions to allow anon role to insert/update
-- This migration fixes the RLS policies for breaking_news table

-- Grant necessary permissions to anon and authenticated roles
GRANT ALL PRIVILEGES ON public.breaking_news TO anon;
GRANT ALL PRIVILEGES ON public.breaking_news TO authenticated;

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Public read access" ON public.breaking_news;
DROP POLICY IF EXISTS "Admin full access" ON public.breaking_news;
DROP POLICY IF EXISTS "Enable all operations for admin users" ON public.breaking_news;
DROP POLICY IF EXISTS "Enable read access for anon" ON public.breaking_news;
DROP POLICY IF EXISTS "Active breaking news is viewable by everyone" ON public.breaking_news;

-- Create new policies that allow anon role to perform all operations
-- This is needed for the admin interface to work properly
CREATE POLICY "Allow public read access to breaking_news" ON public.breaking_news
  FOR SELECT USING (true);

CREATE POLICY "Allow anon insert access to breaking_news" ON public.breaking_news
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon update access to breaking_news" ON public.breaking_news
  FOR UPDATE USING (true);

CREATE POLICY "Allow anon delete access to breaking_news" ON public.breaking_news
  FOR DELETE USING (true);