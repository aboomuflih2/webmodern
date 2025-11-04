-- Fix interview_subjects table structure
-- Execute this script in your Supabase SQL Editor

-- First, let's see the current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'interview_subjects' 
ORDER BY ordinal_position;

-- Add missing columns to interview_subjects table
ALTER TABLE interview_subjects ADD COLUMN IF NOT EXISTS application_id UUID;
ALTER TABLE interview_subjects ADD COLUMN IF NOT EXISTS application_type TEXT;
ALTER TABLE interview_subjects ADD COLUMN IF NOT EXISTS subject_name TEXT;
ALTER TABLE interview_subjects ADD COLUMN IF NOT EXISTS marks INTEGER;
ALTER TABLE interview_subjects ADD COLUMN IF NOT EXISTS max_marks INTEGER;
ALTER TABLE interview_subjects ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE interview_subjects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interview_subjects_application_id ON interview_subjects(application_id);
CREATE INDEX IF NOT EXISTS idx_interview_subjects_application_type ON interview_subjects(application_type);

-- Enable Row Level Security if not already enabled
ALTER TABLE interview_subjects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admin full access to interview_subjects" ON interview_subjects;
DROP POLICY IF EXISTS "Allow authenticated users to manage their interview_subjects" ON interview_subjects;
DROP POLICY IF EXISTS "Allow public read access to interview_subjects" ON interview_subjects;

-- Create RLS policies
CREATE POLICY "Allow public read access to interview_subjects" ON interview_subjects
    FOR SELECT USING (true);

CREATE POLICY "Allow admin full access to interview_subjects" ON interview_subjects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Allow authenticated users to manage interview_subjects" ON interview_subjects
    FOR ALL USING (auth.role() = 'authenticated');

-- Create trigger for updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_interview_subjects_updated_at ON interview_subjects;
CREATE TRIGGER update_interview_subjects_updated_at
    BEFORE UPDATE ON interview_subjects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the table structure after changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'interview_subjects' 
ORDER BY ordinal_position;

-- Test insert to verify everything works
INSERT INTO interview_subjects (application_id, application_type, subject_name, marks, max_marks)
VALUES ('123e4567-e89b-12d3-a456-426614174000', 'kg_std', 'Test Subject', 85, 100);

-- Clean up test data
DELETE FROM interview_subjects WHERE subject_name = 'Test Subject';

-- Show success message
SELECT 'Interview subjects table has been successfully fixed!' as status;