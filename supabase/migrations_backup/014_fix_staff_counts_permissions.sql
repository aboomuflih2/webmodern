-- Fix staff_counts table permissions and RLS policies

-- Grant permissions to anon and authenticated roles for staff_counts table
GRANT ALL PRIVILEGES ON staff_counts TO anon;
GRANT ALL PRIVILEGES ON staff_counts TO authenticated;

-- Create permissive RLS policies for staff_counts table
-- These policies allow all operations for authenticated users and read access for anon

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable all operations for admin users" ON staff_counts;
DROP POLICY IF EXISTS "Enable read access for anon" ON staff_counts;

-- Create new policies
CREATE POLICY "Enable all operations for admin users" ON staff_counts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable read access for anon" ON staff_counts
  FOR SELECT
  TO anon
  USING (true);

-- Ensure the table has initial data if empty
DO $$
BEGIN
  -- Check if staff_counts table is empty
  IF NOT EXISTS (SELECT 1 FROM staff_counts LIMIT 1) THEN
    -- Insert initial staff counts data
    INSERT INTO staff_counts (teaching_staff, security_staff, professional_staff, guides_staff)
    VALUES (20, 4, 12, 2);
    
    RAISE NOTICE 'Initial staff counts data inserted';
  ELSE
    RAISE NOTICE 'Staff counts table already has data';
  END IF;
END $$;

-- Grant usage on sequences for staff_counts (commented out - sequence may not exist)
-- GRANT USAGE ON SEQUENCE staff_counts_id_seq TO anon;
-- GRANT USAGE ON SEQUENCE staff_counts_id_seq TO authenticated;

SELECT 'Staff counts permissions and policies fixed' as status;