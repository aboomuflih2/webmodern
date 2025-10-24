-- Fix staff photos storage permissions to allow anonymous uploads for development
-- This allows the admin interface to work without authentication during development

-- Drop existing restrictive policies for staff-photos
DROP POLICY IF EXISTS "Authenticated users can upload staff photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update staff photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete staff photos" ON storage.objects;

-- Create new policies that allow anonymous access for development
CREATE POLICY "Anyone can upload staff photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'staff-photos');

CREATE POLICY "Anyone can update staff photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'staff-photos');

CREATE POLICY "Anyone can delete staff photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'staff-photos');

-- Keep the public read policy as is
-- CREATE POLICY "Public can view staff photos" ON storage.objects
--   FOR SELECT USING (bucket_id = 'staff-photos');
-- This policy already exists from the previous migration

-- Grant additional permissions to ensure anonymous access works
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO anon;
GRANT SELECT ON storage.buckets TO anon;