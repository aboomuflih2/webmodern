-- Fix academic_programs table by adding missing columns

-- Add missing columns to academic_programs table
ALTER TABLE academic_programs ADD COLUMN IF NOT EXISTS program_title TEXT;
ALTER TABLE academic_programs ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE academic_programs ADD COLUMN IF NOT EXISTS full_description TEXT;
ALTER TABLE academic_programs ADD COLUMN IF NOT EXISTS main_image TEXT;
ALTER TABLE academic_programs ADD COLUMN IF NOT EXISTS category TEXT;

-- Note: program_name column does not exist, skipping data copy

-- Set default values for required fields
UPDATE academic_programs SET short_description = 'Description not available' WHERE short_description IS NULL;
UPDATE academic_programs SET full_description = 'Full description not available' WHERE full_description IS NULL;
UPDATE academic_programs SET category = 'primary' WHERE category IS NULL;

-- Make program_title NOT NULL after copying data
ALTER TABLE academic_programs ALTER COLUMN program_title SET NOT NULL;