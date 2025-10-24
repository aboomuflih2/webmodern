-- Check current permissions and fix RLS policies for admin operations

-- Grant permissions to anon and authenticated roles for all admin tables
GRANT ALL PRIVILEGES ON news_posts TO anon;
GRANT ALL PRIVILEGES ON news_posts TO authenticated;

GRANT ALL PRIVILEGES ON hero_slides TO anon;
GRANT ALL PRIVILEGES ON hero_slides TO authenticated;

GRANT ALL PRIVILEGES ON academic_programs TO anon;
GRANT ALL PRIVILEGES ON academic_programs TO authenticated;

GRANT ALL PRIVILEGES ON testimonials TO anon;
GRANT ALL PRIVILEGES ON testimonials TO authenticated;

GRANT ALL PRIVILEGES ON contact_submissions TO anon;
GRANT ALL PRIVILEGES ON contact_submissions TO authenticated;

GRANT ALL PRIVILEGES ON page_content TO anon;
GRANT ALL PRIVILEGES ON page_content TO authenticated;

GRANT ALL PRIVILEGES ON breaking_news TO anon;
GRANT ALL PRIVILEGES ON breaking_news TO authenticated;

-- Create permissive RLS policies for admin operations
-- These policies allow all operations for authenticated users with admin role

-- News posts policies
DROP POLICY IF EXISTS "Enable all operations for admin users" ON news_posts;
CREATE POLICY "Enable all operations for admin users" ON news_posts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read access for anon" ON news_posts;
CREATE POLICY "Enable read access for anon" ON news_posts
  FOR SELECT
  TO anon
  USING (true);

-- Hero slides policies
DROP POLICY IF EXISTS "Enable all operations for admin users" ON hero_slides;
CREATE POLICY "Enable all operations for admin users" ON hero_slides
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read access for anon" ON hero_slides;
CREATE POLICY "Enable read access for anon" ON hero_slides
  FOR SELECT
  TO anon
  USING (true);

-- Academic programs policies
DROP POLICY IF EXISTS "Enable all operations for admin users" ON academic_programs;
CREATE POLICY "Enable all operations for admin users" ON academic_programs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read access for anon" ON academic_programs;
CREATE POLICY "Enable read access for anon" ON academic_programs
  FOR SELECT
  TO anon
  USING (true);

-- Testimonials policies
DROP POLICY IF EXISTS "Enable all operations for admin users" ON testimonials;
CREATE POLICY "Enable all operations for admin users" ON testimonials
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read access for anon" ON testimonials;
CREATE POLICY "Enable read access for anon" ON testimonials
  FOR SELECT
  TO anon
  USING (true);

-- Contact submissions policies
DROP POLICY IF EXISTS "Enable all operations for admin users" ON contact_submissions;
CREATE POLICY "Enable all operations for admin users" ON contact_submissions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read access for anon" ON contact_submissions;
CREATE POLICY "Enable read access for anon" ON contact_submissions
  FOR SELECT
  TO anon
  USING (true);

-- Page content policies (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'page_content' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Enable all operations for admin users" ON page_content;
    CREATE POLICY "Enable all operations for admin users" ON page_content
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);

    DROP POLICY IF EXISTS "Enable read access for anon" ON page_content;
    CREATE POLICY "Enable read access for anon" ON page_content
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

-- Breaking news policies (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'breaking_news' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Enable all operations for admin users" ON breaking_news;
    CREATE POLICY "Enable all operations for admin users" ON breaking_news
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);

    DROP POLICY IF EXISTS "Enable read access for anon" ON breaking_news;
    CREATE POLICY "Enable read access for anon" ON breaking_news
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant select on all tables to anon for read access
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant all privileges on all tables to authenticated for admin operations
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;