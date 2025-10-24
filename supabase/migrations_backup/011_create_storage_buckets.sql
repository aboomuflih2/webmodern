-- Migration to create storage buckets for file uploads
-- Based on the application requirements found in the codebase

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('hero-images', 'hero-images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('testimonial-photos', 'testimonial-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('program-icons', 'program-icons', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('student-photos', 'student-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('document-uploads', 'document-uploads', false, 104857600, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('news-images', 'news-images', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('gallery-images', 'gallery-images', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('staff-photos', 'staff-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for public buckets

-- Hero Images - Public read, authenticated write
CREATE POLICY "Public can view hero images" ON storage.objects
  FOR SELECT USING (bucket_id = 'hero-images');

CREATE POLICY "Authenticated users can upload hero images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'hero-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update hero images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'hero-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete hero images" ON storage.objects
  FOR DELETE USING (bucket_id = 'hero-images' AND auth.role() = 'authenticated');

-- Testimonial Photos (Leadership) - Public read, authenticated write
CREATE POLICY "Public can view testimonial photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'testimonial-photos');

CREATE POLICY "Authenticated users can upload testimonial photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'testimonial-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update testimonial photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'testimonial-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete testimonial photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'testimonial-photos' AND auth.role() = 'authenticated');

-- Program Icons - Public read, authenticated write
CREATE POLICY "Public can view program icons" ON storage.objects
  FOR SELECT USING (bucket_id = 'program-icons');

CREATE POLICY "Authenticated users can upload program icons" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'program-icons' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update program icons" ON storage.objects
  FOR UPDATE USING (bucket_id = 'program-icons' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete program icons" ON storage.objects
  FOR DELETE USING (bucket_id = 'program-icons' AND auth.role() = 'authenticated');

-- Student Photos - Public read, authenticated write
CREATE POLICY "Public can view student photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'student-photos');

CREATE POLICY "Authenticated users can upload student photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'student-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update student photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'student-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete student photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'student-photos' AND auth.role() = 'authenticated');

-- Document Uploads - Private bucket, authenticated access only
CREATE POLICY "Authenticated users can view their documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'document-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'document-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their documents" ON storage.objects
  FOR UPDATE USING (bucket_id = 'document-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete their documents" ON storage.objects
  FOR DELETE USING (bucket_id = 'document-uploads' AND auth.role() = 'authenticated');

-- News Images - Public read, authenticated write
CREATE POLICY "Public can view news images" ON storage.objects
  FOR SELECT USING (bucket_id = 'news-images');

CREATE POLICY "Authenticated users can upload news images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'news-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update news images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'news-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete news images" ON storage.objects
  FOR DELETE USING (bucket_id = 'news-images' AND auth.role() = 'authenticated');

-- Gallery Images - Public read, authenticated write
CREATE POLICY "Public can view gallery images" ON storage.objects
  FOR SELECT USING (bucket_id = 'gallery-images');

CREATE POLICY "Authenticated users can upload gallery images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'gallery-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update gallery images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'gallery-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete gallery images" ON storage.objects
  FOR DELETE USING (bucket_id = 'gallery-images' AND auth.role() = 'authenticated');

-- Staff Photos - Public read, authenticated write
CREATE POLICY "Public can view staff photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'staff-photos');

CREATE POLICY "Authenticated users can upload staff photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'staff-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update staff photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'staff-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete staff photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'staff-photos' AND auth.role() = 'authenticated');

-- Grant permissions to anon and authenticated roles for storage schema
GRANT USAGE ON SCHEMA storage TO anon, authenticated;
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;

-- RLS is already enabled on storage tables by default

-- Create policy for bucket access
CREATE POLICY "Public can view all buckets" ON storage.buckets
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage buckets" ON storage.buckets
  FOR ALL USING (auth.role() = 'authenticated');