-- Fix foreign key relationships

-- Add foreign key constraint from article_comments to news_posts
ALTER TABLE article_comments 
ADD CONSTRAINT fk_article_comments_news_posts 
FOREIGN KEY (article_id) REFERENCES news_posts(id) ON DELETE CASCADE;

-- Add foreign key constraint from article_likes to news_posts
ALTER TABLE article_likes 
ADD CONSTRAINT fk_article_likes_news_posts 
FOREIGN KEY (article_id) REFERENCES news_posts(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_article_comments_article_id ON article_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_article_likes_article_id ON article_likes(article_id);
CREATE INDEX IF NOT EXISTS idx_news_posts_published_at ON news_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_news_posts_is_published ON news_posts(is_published);

-- Grant permissions for the tables
GRANT SELECT ON article_comments TO anon;
GRANT SELECT ON article_likes TO anon;
GRANT ALL PRIVILEGES ON article_comments TO authenticated;
GRANT ALL PRIVILEGES ON article_likes TO authenticated;