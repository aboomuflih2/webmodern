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

DROP POLICY IF EXISTS "events_public_read" ON events;
DROP POLICY IF EXISTS "events_admin_full_access" ON events;
DROP POLICY IF EXISTS "events_select_policy" ON events;
DROP POLICY IF EXISTS "Allow public read access to events" ON events;
DROP POLICY IF EXISTS "Allow admin full access to events" ON events;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_public_read" ON events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "events_admin_full_access" ON events FOR ALL USING (is_admin()) WITH CHECK (is_admin());
GRANT SELECT ON events TO anon;
GRANT ALL PRIVILEGES ON events TO authenticated;

DROP POLICY IF EXISTS "gallery_photos_public_read" ON gallery_photos;
DROP POLICY IF EXISTS "gallery_photos_admin_full_access" ON gallery_photos;
DROP POLICY IF EXISTS "gallery_photos_select_policy" ON gallery_photos;
DROP POLICY IF EXISTS "Allow public read access to gallery_photos" ON gallery_photos;
DROP POLICY IF EXISTS "Allow admin full access to gallery_photos" ON gallery_photos;
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gallery_photos_public_read" ON gallery_photos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "gallery_photos_admin_full_access" ON gallery_photos FOR ALL USING (is_admin()) WITH CHECK (is_admin());
GRANT SELECT ON gallery_photos TO anon;
GRANT ALL PRIVILEGES ON gallery_photos TO authenticated;

DROP POLICY IF EXISTS "school_stats_public_read" ON school_stats;
DROP POLICY IF EXISTS "school_stats_admin_full_access" ON school_stats;
DROP POLICY IF EXISTS "school_stats_select_policy" ON school_stats;
DROP POLICY IF EXISTS "Allow public read access to school_stats" ON school_stats;
DROP POLICY IF EXISTS "Allow admin full access to school_stats" ON school_stats;
ALTER TABLE school_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "school_stats_public_read" ON school_stats FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "school_stats_admin_full_access" ON school_stats FOR ALL USING (is_admin()) WITH CHECK (is_admin());
GRANT SELECT ON school_stats TO anon;
GRANT ALL PRIVILEGES ON school_stats TO authenticated;

DROP POLICY IF EXISTS "staff_counts_public_read" ON staff_counts;
DROP POLICY IF EXISTS "staff_counts_admin_full_access" ON staff_counts;
DROP POLICY IF EXISTS "staff_counts_select_policy" ON staff_counts;
DROP POLICY IF EXISTS "Allow public read access to staff_counts" ON staff_counts;
DROP POLICY IF EXISTS "Allow admin full access to staff_counts" ON staff_counts;
ALTER TABLE staff_counts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_counts_public_read" ON staff_counts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "staff_counts_admin_full_access" ON staff_counts FOR ALL USING (is_admin()) WITH CHECK (is_admin());
GRANT SELECT ON staff_counts TO anon;
GRANT ALL PRIVILEGES ON staff_counts TO authenticated;

DROP POLICY IF EXISTS "contact_page_content_public_read" ON contact_page_content;
DROP POLICY IF EXISTS "contact_page_content_admin_full_access" ON contact_page_content;
DROP POLICY IF EXISTS "contact_page_content_select_policy" ON contact_page_content;
DROP POLICY IF EXISTS "Allow public read access to contact_page_content" ON contact_page_content;
DROP POLICY IF EXISTS "Allow admin full access to contact_page_content" ON contact_page_content;
ALTER TABLE contact_page_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact_page_content_public_read" ON contact_page_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "contact_page_content_admin_full_access" ON contact_page_content FOR ALL USING (is_admin()) WITH CHECK (is_admin());
GRANT SELECT ON contact_page_content TO anon;
GRANT ALL PRIVILEGES ON contact_page_content TO authenticated;

DROP POLICY IF EXISTS "contact_addresses_public_read" ON contact_addresses;
DROP POLICY IF EXISTS "contact_addresses_admin_full_access" ON contact_addresses;
DROP POLICY IF EXISTS "contact_addresses_select_policy" ON contact_addresses;
DROP POLICY IF EXISTS "Allow public read access to contact_addresses" ON contact_addresses;
DROP POLICY IF EXISTS "Allow admin full access to contact_addresses" ON contact_addresses;
ALTER TABLE contact_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact_addresses_public_read" ON contact_addresses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "contact_addresses_admin_full_access" ON contact_addresses FOR ALL USING (is_admin()) WITH CHECK (is_admin());
GRANT SELECT ON contact_addresses TO anon;
GRANT ALL PRIVILEGES ON contact_addresses TO authenticated;

DROP POLICY IF EXISTS "contact_locations_public_read" ON contact_locations;
DROP POLICY IF EXISTS "contact_locations_admin_full_access" ON contact_locations;
DROP POLICY IF EXISTS "contact_locations_select_policy" ON contact_locations;
DROP POLICY IF EXISTS "Allow public read access to contact_locations" ON contact_locations;
DROP POLICY IF EXISTS "Allow admin full access to contact_locations" ON contact_locations;
ALTER TABLE contact_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact_locations_public_read" ON contact_locations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "contact_locations_admin_full_access" ON contact_locations FOR ALL USING (is_admin()) WITH CHECK (is_admin());
GRANT SELECT ON contact_locations TO anon;
GRANT ALL PRIVILEGES ON contact_locations TO authenticated;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_storage_public_buckets" ON storage.objects;
CREATE POLICY "public_read_storage_public_buckets" ON storage.objects FOR SELECT TO anon USING (
  bucket_id IN (
    'hero-images',
    'testimonial-photos',
    'program-icons',
    'news-images',
    'gallery-images',
    'staff-photos',
    'program-images',
    'student-photos'
  )
);
DROP POLICY IF EXISTS "authenticated_all_storage_public_buckets" ON storage.objects;
CREATE POLICY "authenticated_all_storage_public_buckets" ON storage.objects FOR ALL TO authenticated USING (
  bucket_id IN (
    'hero-images',
    'testimonial-photos',
    'program-icons',
    'news-images',
    'gallery-images',
    'staff-photos',
    'program-images',
    'student-photos'
  )
) WITH CHECK (
  bucket_id IN (
    'hero-images',
    'testimonial-photos',
    'program-icons',
    'news-images',
    'gallery-images',
    'staff-photos',
    'program-images',
    'student-photos'
  )
);

SELECT 'policies_applied_extra' AS result;
