-- Fix events table permissions for authenticated users
-- Grant proper permissions to authenticated role for events table

GRANT ALL PRIVILEGES ON public.events TO authenticated;

-- Ensure anon role can only read events
GRANT SELECT ON public.events TO anon;

-- Create policy for authenticated users to insert/update/delete events
DROP POLICY IF EXISTS "Authenticated users can manage events" ON public.events;
CREATE POLICY "Authenticated users can manage events" 
  ON public.events 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Ensure public can read published events
DROP POLICY IF EXISTS "Public can read published events" ON public.events;
CREATE POLICY "Public can read published events" 
  ON public.events 
  FOR SELECT 
  TO anon 
  USING (is_published = true);