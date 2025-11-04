-- Migration: Rename child_name column to full_name in kg_std_applications table
-- Created: 2024-01-13

ALTER TABLE kg_std_applications 
RENAME COLUMN child_name TO full_name;

-- Verify the column exists after rename
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'kg_std_applications' 
AND table_schema = 'public'
ORDER BY ordinal_position;