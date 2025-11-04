-- Fix RLS policies for hero_slides table to allow admin operations

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Hero slides are viewable by everyone" ON "public"."hero_slides";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."hero_slides";
DROP POLICY IF EXISTS "Enable insert for admin users" ON "public"."hero_slides";
DROP POLICY IF EXISTS "Enable update for admin users" ON "public"."hero_slides";
DROP POLICY IF EXISTS "Enable delete for admin users" ON "public"."hero_slides";

-- Create function to check if user is admin (if not exists)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hero slides policies
CREATE POLICY "Enable read access for all users" ON "public"."hero_slides"
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for admin users" ON "public"."hero_slides"
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Enable update for admin users" ON "public"."hero_slides"
  FOR UPDATE USING (is_admin());

CREATE POLICY "Enable delete for admin users" ON "public"."hero_slides"
  FOR DELETE USING (is_admin());

-- Grant necessary permissions
GRANT ALL ON "public"."hero_slides" TO authenticated;
GRANT SELECT ON "public"."hero_slides" TO anon;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;