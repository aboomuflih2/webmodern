-- Add message column to breaking_news table
-- This fixes the schema mismatch where the frontend expects a 'message' column

ALTER TABLE public.breaking_news 
ADD COLUMN IF NOT EXISTS message TEXT;

-- Update existing records to populate the message column from title and content
UPDATE public.breaking_news 
SET message = CASE 
    WHEN content IS NOT NULL AND content != '' THEN content
    WHEN title IS NOT NULL AND title != '' THEN title
    ELSE 'Breaking News Update'
END
WHERE message IS NULL;

-- Make message column NOT NULL after populating existing data
ALTER TABLE public.breaking_news 
ALTER COLUMN message SET NOT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN public.breaking_news.message IS 'Main message text displayed in the breaking news banner';