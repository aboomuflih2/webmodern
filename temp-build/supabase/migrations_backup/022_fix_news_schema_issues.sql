-- Fix news_posts schema issues and foreign key relationships
-- Migration to resolve column mismatches and relationship problems

-- 1. Fix the publication_date column issue
-- The frontend is using 'publication_date' but the table has 'published_at'
-- We'll add publication_date and sync it with published_at
ALTER TABLE public.news_posts 
ADD COLUMN IF NOT EXISTS publication_date timestamp with time zone;

-- Update publication_date with existing published_at values
UPDATE public.news_posts 
SET publication_date = published_at 
WHERE publication_date IS NULL AND published_at IS NOT NULL;

-- For records without published_at, set publication_date to created_at if published
UPDATE public.news_posts 
SET publication_date = created_at 
WHERE publication_date IS NULL AND is_published = true;

-- 2. Fix the foreign key relationship between article_comments and news_posts
-- The error suggests the relationship is not properly defined
-- First, let's ensure the article_id column references news_posts.id
ALTER TABLE public.article_comments 
DROP CONSTRAINT IF EXISTS article_comments_article_id_fkey;

ALTER TABLE public.article_comments 
ADD CONSTRAINT article_comments_article_id_fkey 
FOREIGN KEY (article_id) REFERENCES public.news_posts(id) ON DELETE CASCADE;

-- 3. Add missing author column to news_posts if it doesn't exist
ALTER TABLE public.news_posts 
ADD COLUMN IF NOT EXISTS author text;

-- 4. Ensure proper permissions for the tables
GRANT SELECT ON public.news_posts TO anon;
GRANT SELECT ON public.article_comments TO anon;
GRANT ALL PRIVILEGES ON public.news_posts TO authenticated;
GRANT ALL PRIVILEGES ON public.article_comments TO authenticated;

-- 5. Update RLS policies to ensure proper access
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Published news posts are viewable by everyone" ON public.news_posts;
DROP POLICY IF EXISTS "Public read access" ON public.article_comments;
DROP POLICY IF EXISTS "Admin full access" ON public.article_comments;

-- Recreate policies with proper conditions
CREATE POLICY "Published news posts are viewable by everyone" ON public.news_posts
    FOR SELECT USING (is_published = true);

CREATE POLICY "Authenticated users can manage news posts" ON public.news_posts
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public can read approved comments" ON public.article_comments
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Authenticated users can manage comments" ON public.article_comments
    FOR ALL USING (auth.role() = 'authenticated');

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_news_posts_publication_date ON public.news_posts(publication_date DESC);
CREATE INDEX IF NOT EXISTS idx_news_posts_published ON public.news_posts(is_published, publication_date DESC);
CREATE INDEX IF NOT EXISTS idx_article_comments_article_id ON public.article_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_approved ON public.article_comments(is_approved, created_at DESC);

SELECT 'News schema issues fixed successfully' as status;