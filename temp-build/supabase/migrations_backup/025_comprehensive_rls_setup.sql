-- Comprehensive RLS Setup for News, Events, and Gallery
-- This migration sets up proper Row Level Security policies

-- First, ensure RLS is enabled on all tables
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "news_posts_select_policy" ON public.news_posts;
DROP POLICY IF EXISTS "news_posts_insert_policy" ON public.news_posts;
DROP POLICY IF EXISTS "news_posts_update_policy" ON public.news_posts;
DROP POLICY IF EXISTS "news_posts_delete_policy" ON public.news_posts;

DROP POLICY IF EXISTS "events_select_policy" ON public.events;
DROP POLICY IF EXISTS "events_insert_policy" ON public.events;
DROP POLICY IF EXISTS "events_update_policy" ON public.events;
DROP POLICY IF EXISTS "events_delete_policy" ON public.events;

DROP POLICY IF EXISTS "gallery_photos_select_policy" ON public.gallery_photos;
DROP POLICY IF EXISTS "gallery_photos_insert_policy" ON public.gallery_photos;
DROP POLICY IF EXISTS "gallery_photos_update_policy" ON public.gallery_photos;
DROP POLICY IF EXISTS "gallery_photos_delete_policy" ON public.gallery_photos;

-- Grant table permissions to roles
GRANT ALL PRIVILEGES ON public.news_posts TO authenticated;
GRANT ALL PRIVILEGES ON public.events TO authenticated;
GRANT ALL PRIVILEGES ON public.gallery_photos TO authenticated;

GRANT SELECT ON public.news_posts TO anon;
GRANT SELECT ON public.events TO anon;
GRANT SELECT ON public.gallery_photos TO anon;

-- Create RLS policies for news_posts
CREATE POLICY "news_posts_select_policy" ON public.news_posts
    FOR SELECT USING (true);

CREATE POLICY "news_posts_insert_policy" ON public.news_posts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "news_posts_update_policy" ON public.news_posts
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "news_posts_delete_policy" ON public.news_posts
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for events
CREATE POLICY "events_select_policy" ON public.events
    FOR SELECT USING (true);

CREATE POLICY "events_insert_policy" ON public.events
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "events_update_policy" ON public.events
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "events_delete_policy" ON public.events
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for gallery_photos
CREATE POLICY "gallery_photos_select_policy" ON public.gallery_photos
    FOR SELECT USING (true);

CREATE POLICY "gallery_photos_insert_policy" ON public.gallery_photos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "gallery_photos_update_policy" ON public.gallery_photos
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "gallery_photos_delete_policy" ON public.gallery_photos
    FOR DELETE USING (auth.role() = 'authenticated');

-- Grant usage on sequences if they exist
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;