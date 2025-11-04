-- Fix column mismatches between frontend and database schema

-- Add missing columns to hero_slides
ALTER TABLE public.hero_slides 
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Update existing order_index to display_order if needed
UPDATE public.hero_slides SET display_order = order_index WHERE display_order IS NULL;

-- Add missing columns to news_posts
ALTER TABLE public.news_posts
ADD COLUMN IF NOT EXISTS publication_date timestamp with time zone DEFAULT NOW();

-- Update publication_date with existing published_at values
UPDATE public.news_posts 
SET publication_date = published_at 
WHERE publication_date IS NULL AND published_at IS NOT NULL;

-- Update existing published_at to publication_date if needed
UPDATE public.news_posts SET publication_date = published_at WHERE publication_date IS NULL;

-- Create breaking_news table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.breaking_news (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    message text NOT NULL,
    is_active boolean DEFAULT true,
    priority integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on breaking_news
ALTER TABLE public.breaking_news ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON public.breaking_news TO anon;
GRANT ALL PRIVILEGES ON public.breaking_news TO authenticated;

-- Create RLS policy for breaking_news
CREATE POLICY "Active breaking news is viewable by everyone" ON public.breaking_news
    FOR SELECT USING (is_active = true);

SELECT 'Column mismatches fixed and missing tables created' as status