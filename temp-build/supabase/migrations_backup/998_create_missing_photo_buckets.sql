-- Create missing storage buckets for news-photos and event-photos
-- These buckets are referenced in the PhotoUpload component but were not created

-- Create news-photos bucket (separate from news-images for form uploads)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('news-photos', 'news-photos', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Create event-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('event-photos', 'event-photos', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for news-photos bucket
CREATE POLICY "Public can view news photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'news-photos');

CREATE POLICY "Authenticated users can upload news photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'news-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update news photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'news-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete news photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'news-photos' AND auth.role() = 'authenticated');

-- Storage policies for event-photos bucket
CREATE POLICY "Public can view event photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-photos');

CREATE POLICY "Authenticated users can upload event photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'event-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update event photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'event-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete event photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'event-photos' AND auth.role() = 'authenticated');

-- Grant necessary permissions (these should already exist from previous migrations)
-- But adding them here for completeness
GRANT USAGE ON SCHEMA storage TO anon, authenticated;
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;