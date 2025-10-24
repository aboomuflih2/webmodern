-- Fix publication_date column issue in news_posts table
-- This migration adds the missing publication_date column that the frontend expects

-- Add publication_date column if it doesn't exist
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

-- For unpublished records, set publication_date to created_at as fallback
UPDATE public.news_posts 
SET publication_date = created_at 
WHERE publication_date IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_news_posts_publication_date ON public.news_posts(publication_date DESC);
CREATE INDEX IF NOT EXISTS idx_news_posts_published ON public.news_posts(is_published, publication_date DESC);

-- Ensure proper permissions
GRANT SELECT ON public.news_posts TO anon;
GRANT ALL PRIVILEGES ON public.news_posts TO authenticated;

SELECT 'Publication date column fixed successfully' as status;