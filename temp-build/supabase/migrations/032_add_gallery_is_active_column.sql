-- Add missing is_active column to gallery_photos table
-- This fixes the error: "Could not find the 'is_active' column of 'gallery_photos' in the schema cache"

-- Add the is_active column with default value true
ALTER TABLE public.gallery_photos 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Add a comment to document the column
COMMENT ON COLUMN public.gallery_photos.is_active IS 'Controls whether the photo is visible in the public gallery';

-- Update any existing records to be active by default
UPDATE public.gallery_photos 
SET is_active = true 
WHERE is_active IS NULL;

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'gallery_photos' 
  AND column_name = 'is_active';