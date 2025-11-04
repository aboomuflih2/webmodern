-- Add category column to academic_programs table
ALTER TABLE academic_programs ADD COLUMN IF NOT EXISTS category TEXT;

-- Update existing records with a default category if needed
UPDATE academic_programs SET category = 'General' WHERE category IS NULL;

-- Grant permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON academic_programs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON academic_programs TO authenticated;