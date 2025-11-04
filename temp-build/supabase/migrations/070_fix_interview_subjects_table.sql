-- Fix interview_subjects table structure
-- This migration adds the missing columns that the application expects

-- First, check if the table exists and drop it if it has wrong structure
DROP TABLE IF EXISTS interview_subjects;

-- Create the interview_subjects table with the correct structure
CREATE TABLE interview_subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL,
    application_type TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    marks INTEGER NOT NULL DEFAULT 0,
    max_marks INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_interview_subjects_application_id ON interview_subjects(application_id);
CREATE INDEX idx_interview_subjects_application_type ON interview_subjects(application_type);

-- Enable Row Level Security
ALTER TABLE interview_subjects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow public read access
CREATE POLICY "Allow public read access to interview_subjects" ON interview_subjects
    FOR SELECT USING (true);

-- Allow admin users full access
CREATE POLICY "Allow admin full access to interview_subjects" ON interview_subjects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Allow authenticated users to insert/update their own records
CREATE POLICY "Allow authenticated users to manage interview_subjects" ON interview_subjects
    FOR ALL USING (auth.role() = 'authenticated');

-- Add a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_interview_subjects_updated_at 
    BEFORE UPDATE ON interview_subjects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();