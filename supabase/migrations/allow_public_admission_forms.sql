-- Allow public users to fill admission forms
-- This grants necessary permissions for anonymous users to submit admission forms

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow public to submit KG STD forms" ON kg_std_applications;
DROP POLICY IF EXISTS "Allow public to submit Plus One forms" ON plus_one_applications;
DROP POLICY IF EXISTS "Allow public to read form settings" ON admission_forms;
DROP POLICY IF EXISTS "Admin full access" ON kg_std_applications;
DROP POLICY IF EXISTS "Public read access" ON kg_std_applications;
DROP POLICY IF EXISTS "Admin full access" ON plus_one_applications;
DROP POLICY IF EXISTS "Public read access" ON plus_one_applications;

-- Grant permissions to anon role for admission form tables
GRANT SELECT, INSERT ON kg_std_applications TO anon;
GRANT SELECT, INSERT ON plus_one_applications TO anon;

-- Note: These tables use UUID primary keys with gen_random_uuid(), not sequences

-- Grant permissions to authenticated role for admission form tables
GRANT ALL PRIVILEGES ON kg_std_applications TO authenticated;
GRANT ALL PRIVILEGES ON plus_one_applications TO authenticated;

-- Grant read access to admission_forms table to check if forms are active
GRANT SELECT ON admission_forms TO anon;

-- Create RLS policies for public form submission

-- Policy for KG & STD forms - allow insert for everyone
CREATE POLICY "Allow public to submit KG STD forms" ON kg_std_applications
  FOR INSERT TO anon
  WITH CHECK (true);

-- Policy for Plus One forms - allow insert for everyone  
CREATE POLICY "Allow public to submit Plus One forms" ON plus_one_applications
  FOR INSERT TO anon
  WITH CHECK (true);

-- Policy to allow public to read admission form settings (to check if forms are active)
CREATE POLICY "Allow public to read form settings" ON admission_forms
  FOR SELECT TO anon
  USING (true);

-- Optional: Grant permissions for file uploads if using Supabase Storage
-- Uncomment the following lines if you have file upload functionality

-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('admission-documents', 'admission-documents', true)
-- ON CONFLICT (id) DO NOTHING;

-- CREATE POLICY "Allow public to upload admission documents" ON storage.objects
--   FOR INSERT TO anon
--   WITH CHECK (bucket_id = 'admission-documents');

-- CREATE POLICY "Allow public to view admission documents" ON storage.objects
--   FOR SELECT TO anon
--   USING (bucket_id = 'admission-documents');