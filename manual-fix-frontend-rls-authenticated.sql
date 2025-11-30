DROP POLICY IF EXISTS "page_content_authenticated_all" ON page_content;
CREATE POLICY "page_content_authenticated_all" ON page_content FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "hero_slides_authenticated_all" ON hero_slides;
CREATE POLICY "hero_slides_authenticated_all" ON hero_slides FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "breaking_news_authenticated_all" ON breaking_news;
CREATE POLICY "breaking_news_authenticated_all" ON breaking_news FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "academic_programs_authenticated_all" ON academic_programs;
CREATE POLICY "academic_programs_authenticated_all" ON academic_programs FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "news_posts_authenticated_all" ON news_posts;
CREATE POLICY "news_posts_authenticated_all" ON news_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "testimonials_authenticated_all" ON testimonials;
CREATE POLICY "testimonials_authenticated_all" ON testimonials FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "events_authenticated_all" ON events;
CREATE POLICY "events_authenticated_all" ON events FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "gallery_photos_authenticated_all" ON gallery_photos;
CREATE POLICY "gallery_photos_authenticated_all" ON gallery_photos FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "school_stats_authenticated_all" ON school_stats;
CREATE POLICY "school_stats_authenticated_all" ON school_stats FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "staff_counts_authenticated_all" ON staff_counts;
CREATE POLICY "staff_counts_authenticated_all" ON staff_counts FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "contact_page_content_authenticated_all" ON contact_page_content;
CREATE POLICY "contact_page_content_authenticated_all" ON contact_page_content FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "contact_addresses_authenticated_all" ON contact_addresses;
CREATE POLICY "contact_addresses_authenticated_all" ON contact_addresses FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "contact_locations_authenticated_all" ON contact_locations;
CREATE POLICY "contact_locations_authenticated_all" ON contact_locations FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "school_features_authenticated_all" ON school_features;
CREATE POLICY "school_features_authenticated_all" ON school_features FOR ALL TO authenticated USING (true) WITH CHECK (true);

SELECT 'policies_applied_authenticated' AS result;
