-- Fix article_comments column name mismatch
-- The frontend expects 'comment_text' but the database has 'comment_content'

-- Rename comment_content column to comment_text
ALTER TABLE public.article_comments 
RENAME COLUMN comment_content TO comment_text;

-- Add a comment to document this fix
COMMENT ON COLUMN public.article_comments.comment_text IS 'Comment text content - renamed from comment_content to match frontend expectations';

SELECT 'Comment text column fixed successfully' as status;