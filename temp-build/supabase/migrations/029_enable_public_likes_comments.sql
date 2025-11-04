-- Enable public insert for article_likes and article_comments
-- Allows anonymous users to like articles and submit comments for review

-- article_likes: permit INSERT for everyone (unique constraint still applies)
DROP POLICY IF EXISTS "Public can like articles" ON public.article_likes;
CREATE POLICY "Public can like articles" ON public.article_likes
  FOR INSERT
  WITH CHECK (true);

-- article_comments: permit INSERT for everyone; read remains gated by approval
DROP POLICY IF EXISTS "Public can submit comments" ON public.article_comments;
CREATE POLICY "Public can submit comments" ON public.article_comments
  FOR INSERT
  WITH CHECK (true);

-- Keep existing SELECT/ADMIN policies as defined in earlier migrations
SELECT 'Public like/comment insert enabled' AS status;

