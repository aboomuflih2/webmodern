CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  RETURN COALESCE(
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin',
    false
  );
END;
$$;

DROP POLICY IF EXISTS "page_content_public_read" ON page_content;
DROP POLICY IF EXISTS "page_content_admin_full_access" ON page_content;
DROP POLICY IF EXISTS "page_content_select_policy" ON page_content;
DROP POLICY IF EXISTS "Allow public read access to page_content" ON page_content;
DROP POLICY IF EXISTS "Allow admin full access to page_content" ON page_content;
ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "page_content_public_read" ON page_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "page_content_admin_full_access" ON page_content FOR ALL USING (is_admin()) WITH CHECK (is_admin());
GRANT SELECT ON page_content TO anon;
GRANT ALL PRIVILEGES ON page_content TO authenticated;

DROP POLICY IF EXISTS "hero_slides_public_read" ON hero_slides;
DROP POLICY IF EXISTS "hero_slides_admin_full_access" ON hero_slides;
DROP POLICY IF EXISTS "hero_slides_select_policy" ON hero_slides;
DROP POLICY IF EXISTS "Allow public read access to hero_slides" ON hero_slides;
DROP POLICY IF EXISTS "Allow admin full access to hero_slides" ON hero_slides;
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hero_slides_public_read" ON hero_slides FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "hero_slides_admin_full_access" ON hero_slides FOR ALL USING (is_admin()) WITH CHECK (is_admin());
GRANT SELECT ON hero_slides TO anon;
GRANT ALL PRIVILEGES ON hero_slides TO authenticated;

DROP POLICY IF EXISTS "breaking_news_public_read" ON breaking_news;
DROP POLICY IF EXISTS "breaking_news_admin_full_access" ON breaking_news;
DROP POLICY IF EXISTS "breaking_news_select_policy" ON breaking_news;
DROP POLICY IF EXISTS "Allow public read access to breaking_news" ON breaking_news;
DROP POLICY IF EXISTS "Allow admin full access to breaking_news" ON breaking_news;
ALTER TABLE breaking_news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "breaking_news_public_read" ON breaking_news FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "breaking_news_admin_full_access" ON breaking_news FOR ALL USING (is_admin()) WITH CHECK (is_admin());
GRANT SELECT ON breaking_news TO anon;
GRANT ALL PRIVILEGES ON breaking_news TO authenticated;

DROP POLICY IF EXISTS "academic_programs_public_read" ON academic_programs;
DROP POLICY IF EXISTS "academic_programs_admin_full_access" ON academic_programs;
DROP POLICY IF EXISTS "academic_programs_select_policy" ON academic_programs;
DROP POLICY IF EXISTS "Allow public read access to academic_programs" ON academic_programs;
DROP POLICY IF EXISTS "Allow admin full access to academic_programs" ON academic_programs;
ALTER TABLE academic_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "academic_programs_public_read" ON academic_programs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "academic_programs_admin_full_access" ON academic_programs FOR ALL USING (is_admin()) WITH CHECK (is_admin());
GRANT SELECT ON academic_programs TO anon;
GRANT ALL PRIVILEGES ON academic_programs TO authenticated;

DROP POLICY IF EXISTS "news_posts_public_read" ON news_posts;
DROP POLICY IF EXISTS "news_posts_admin_full_access" ON news_posts;
DROP POLICY IF EXISTS "news_posts_select_policy" ON news_posts;
DROP POLICY IF EXISTS "Allow public read access to news_posts" ON news_posts;
DROP POLICY IF EXISTS "Allow admin full access to news_posts" ON news_posts;
ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_posts_public_read" ON news_posts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "news_posts_admin_full_access" ON news_posts FOR ALL USING (is_admin()) WITH CHECK (is_admin());
GRANT SELECT ON news_posts TO anon;
GRANT ALL PRIVILEGES ON news_posts TO authenticated;

DROP POLICY IF EXISTS "testimonials_public_read" ON testimonials;
DROP POLICY IF EXISTS "testimonials_admin_full_access" ON testimonials;
DROP POLICY IF EXISTS "testimonials_select_policy" ON testimonials;
DROP POLICY IF EXISTS "Allow public read access to testimonials" ON testimonials;
DROP POLICY IF EXISTS "Allow admin full access to testimonials" ON testimonials;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "testimonials_public_read" ON testimonials FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "testimonials_admin_full_access" ON testimonials FOR ALL USING (is_admin()) WITH CHECK (is_admin());
GRANT SELECT ON testimonials TO anon;
GRANT ALL PRIVILEGES ON testimonials TO authenticated;

DROP POLICY IF EXISTS "contact_submissions_public_insert" ON contact_submissions;
DROP POLICY IF EXISTS "contact_submissions_admin_full_access" ON contact_submissions;
DROP POLICY IF EXISTS "contact_submissions_select_policy" ON contact_submissions;
DROP POLICY IF EXISTS "Allow public insert to contact_submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Allow admin full access to contact_submissions" ON contact_submissions;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact_submissions_public_insert" ON contact_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "contact_submissions_admin_full_access" ON contact_submissions FOR ALL USING (is_admin()) WITH CHECK (is_admin());
GRANT INSERT ON contact_submissions TO anon;
GRANT ALL PRIVILEGES ON contact_submissions TO authenticated;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_storage_public_buckets" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_all_storage_public_buckets" ON storage.objects;
DROP POLICY IF EXISTS "admin_full_access_storage" ON storage.objects;
CREATE POLICY "public_read_storage_public_buckets" ON storage.objects FOR SELECT TO anon USING (
  bucket_id IN (
    'hero-images',
    'testimonial-photos',
    'program-icons',
    'news-images',
    'gallery-images',
    'staff-photos',
    'program-images'
  )
);
CREATE POLICY "authenticated_all_storage_public_buckets" ON storage.objects FOR ALL TO authenticated USING (
  bucket_id IN (
    'hero-images',
    'testimonial-photos',
    'program-icons',
    'news-images',
    'gallery-images',
    'staff-photos',
    'program-images'
  )
) WITH CHECK (
  bucket_id IN (
    'hero-images',
    'testimonial-photos',
    'program-icons',
    'news-images',
    'gallery-images',
    'staff-photos',
    'program-images'
  )
);
CREATE POLICY "admin_full_access_storage" ON storage.objects FOR ALL USING (is_admin()) WITH CHECK (is_admin());
GRANT SELECT ON storage.objects TO anon;
GRANT ALL PRIVILEGES ON storage.objects TO authenticated;

SELECT 'policies_applied' AS result;
