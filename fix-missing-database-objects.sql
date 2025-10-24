-- Fix Missing Database Objects
-- Run this script in Supabase Dashboard > SQL Editor

-- 1. Add missing columns to existing tables
ALTER TABLE news_posts ADD COLUMN IF NOT EXISTS publication_date timestamp with time zone;
ALTER TABLE academic_programs ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE gallery_photos ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE interview_subject_templates ADD COLUMN IF NOT EXISTS form_type text;

-- 2. Create the is_admin() function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant permissions on the is_admin function
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO anon;

-- 4. Test the function
SELECT 'is_admin() function created successfully' as status, is_admin() as test_result;

-- 5. Verify columns were added
SELECT 'Missing columns check:' as status;
SELECT column_name, table_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND (
  (table_name = 'news_posts' AND column_name = 'publication_date') OR
  (table_name = 'academic_programs' AND column_name = 'category') OR
  (table_name = 'gallery_photos' AND column_name = 'is_active') OR
  (table_name = 'interview_subject_templates' AND column_name = 'form_type')
)
ORDER BY table_name, column_name;