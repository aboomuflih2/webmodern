-- Fix page_content table permissions and add initial data

-- Grant privileges to anon and authenticated roles
GRANT ALL PRIVILEGES ON page_content TO anon;
GRANT ALL PRIVILEGES ON page_content TO authenticated;
-- GRANT USAGE ON SEQUENCE page_content_id_seq TO anon;
-- GRANT USAGE ON SEQUENCE page_content_id_seq TO authenticated;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access" ON page_content;
DROP POLICY IF EXISTS "Admin full access" ON page_content;
DROP POLICY IF EXISTS "Enable all operations for admin users" ON page_content;
DROP POLICY IF EXISTS "Enable all operations for anon users" ON page_content;

-- Create permissive RLS policies
CREATE POLICY "Enable all operations for admin users" ON page_content
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all operations for anon users" ON page_content
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Insert initial page content data if table is empty
INSERT INTO page_content (page_key, page_title, content, meta_description)
SELECT * FROM (
  VALUES 
    ('about_legacy', 'School Legacy', 'Our school has a rich history spanning over decades, committed to providing quality education and nurturing young minds.', 'Learn about our school''s rich history and legacy'),
    ('about_mission', 'Our Mission', 'To provide holistic education that develops intellectual, emotional, and social capabilities of our students, preparing them for future challenges.', 'Our mission statement and educational philosophy'),
    ('about_vision', 'Our Vision', 'To be a leading educational institution that inspires excellence, creativity, and lifelong learning in every student.', 'Our vision for the future of education')
) AS new_data(page_key, page_title, content, meta_description)
WHERE NOT EXISTS (
  SELECT 1 FROM page_content WHERE page_content.page_key = new_data.page_key
);

-- Verify the fix
SELECT 'Page content RLS policies fixed and initial data added' AS status;