-- Create hero-images storage bucket and set up RLS policies

-- Create the hero-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hero-images',
  'hero-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Note: RLS and policies for storage.objects are managed by Supabase automatically
-- Just ensure the bucket exists for file uploads