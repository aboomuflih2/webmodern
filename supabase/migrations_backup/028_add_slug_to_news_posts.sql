-- Add slug column to news_posts table
ALTER TABLE news_posts 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_news_posts_slug ON news_posts(slug);

-- Update existing records to have slugs based on title (if any exist)
UPDATE news_posts 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL AND title IS NOT NULL;