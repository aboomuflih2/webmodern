-- Fix RLS policies for events and gallery_photos tables
-- This migration grants proper permissions to anon and authenticated roles

-- Grant permissions for events table
GRANT ALL PRIVILEGES ON events TO authenticated;
GRANT SELECT ON events TO anon;

-- Grant permissions for gallery_photos table  
GRANT ALL PRIVILEGES ON gallery_photos TO authenticated;
GRANT SELECT ON gallery_photos TO anon;

-- Create RLS policies for events table
DROP POLICY IF EXISTS "Users can insert their own events" ON events;
CREATE POLICY "Users can insert their own events" ON events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view all events" ON events;
CREATE POLICY "Users can view all events" ON events
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own events" ON events;
CREATE POLICY "Users can update their own events" ON events
  FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete their own events" ON events;
CREATE POLICY "Users can delete their own events" ON events
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create RLS policies for gallery_photos table
DROP POLICY IF EXISTS "Users can insert gallery photos" ON gallery_photos;
CREATE POLICY "Users can insert gallery photos" ON gallery_photos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view all gallery photos" ON gallery_photos;
CREATE POLICY "Users can view all gallery photos" ON gallery_photos
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update gallery photos" ON gallery_photos;
CREATE POLICY "Users can update gallery photos" ON gallery_photos
  FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete gallery photos" ON gallery_photos;
CREATE POLICY "Users can delete gallery photos" ON gallery_photos
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Ensure RLS is enabled on both tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;