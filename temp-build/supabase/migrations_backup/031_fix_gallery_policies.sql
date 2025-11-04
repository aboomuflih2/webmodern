-- Ensure gallery_photos RLS allows admin writes and public reads

-- Enable RLS on gallery_photos
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

-- Drop any existing gallery policies that might conflict
DROP POLICY IF EXISTS "Users can insert gallery photos" ON public.gallery_photos;
DROP POLICY IF EXISTS "Users can view all gallery photos" ON public.gallery_photos;
DROP POLICY IF EXISTS "Users can update gallery photos" ON public.gallery_photos;
DROP POLICY IF EXISTS "Users can delete gallery photos" ON public.gallery_photos;
DROP POLICY IF EXISTS "gallery_photos_select_policy" ON public.gallery_photos;
DROP POLICY IF EXISTS "gallery_photos_insert_policy" ON public.gallery_photos;
DROP POLICY IF EXISTS "gallery_photos_update_policy" ON public.gallery_photos;
DROP POLICY IF EXISTS "gallery_photos_delete_policy" ON public.gallery_photos;

-- Public read access
CREATE POLICY "Allow public read gallery" ON public.gallery_photos
  FOR SELECT USING (true);

-- Admin full access (uses is_admin() helper)
CREATE POLICY "Allow admin full gallery access" ON public.gallery_photos
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Grants to roles
GRANT ALL PRIVILEGES ON public.gallery_photos TO authenticated;
GRANT SELECT ON public.gallery_photos TO anon;

SELECT 'gallery_photos policies updated' AS status;

