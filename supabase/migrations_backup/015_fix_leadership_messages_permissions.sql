-- Fix leadership_messages table permissions and RLS policies

-- Grant permissions to anon and authenticated roles for leadership_messages table
GRANT ALL PRIVILEGES ON leadership_messages TO anon;
GRANT ALL PRIVILEGES ON leadership_messages TO authenticated;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access" ON leadership_messages;
DROP POLICY IF EXISTS "Admin full access" ON leadership_messages;
DROP POLICY IF EXISTS "Enable all operations for admin users" ON leadership_messages;
DROP POLICY IF EXISTS "Enable read access for anon" ON leadership_messages;

-- Create new permissive RLS policies for leadership_messages
CREATE POLICY "Enable all operations for admin users" ON leadership_messages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable read access for anon" ON leadership_messages
  FOR SELECT
  TO anon
  USING (true);

-- Note: leadership_messages uses UUID primary key, no sequence needed