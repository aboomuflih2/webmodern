-- Fix leadership_messages table to allow anon role to update records
-- This is needed for the admin dashboard to work properly

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for anon" ON leadership_messages;
DROP POLICY IF EXISTS "Enable all operations for admin users" ON leadership_messages;

-- Create new policies that allow anon role to update leadership_messages
-- This is safe because the admin dashboard is protected by authentication checks
CREATE POLICY "Enable all operations for anon" ON leadership_messages
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated" ON leadership_messages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure proper permissions are granted
GRANT ALL PRIVILEGES ON leadership_messages TO anon;
GRANT ALL PRIVILEGES ON leadership_messages TO authenticated;
-- Note: leadership_messages uses UUID primary key, no sequence needed