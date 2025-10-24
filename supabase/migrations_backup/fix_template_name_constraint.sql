-- Fix interview_subject_templates table schema issue
-- This migration drops the existing table and recreates it with the correct schema
-- to resolve the template_name column not-null constraint violation

-- First, backup any existing data (if the table exists)
DO $$
BEGIN
    -- Check if the table exists and has data
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'interview_subject_templates') THEN
        -- Create a backup table if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'interview_subject_templates_backup') THEN
            CREATE TABLE interview_subject_templates_backup AS SELECT * FROM interview_subject_templates;
            RAISE NOTICE 'Backup created: interview_subject_templates_backup';
        END IF;
    END IF;
END $$;

-- Drop the existing table completely
DROP TABLE IF EXISTS interview_subject_templates CASCADE;

-- Create the new table with the correct schema
CREATE TABLE interview_subject_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_type TEXT NOT NULL CHECK (form_type IN ('admission', 'interview')),
    subject_name TEXT NOT NULL,
    max_marks INTEGER NOT NULL DEFAULT 25,
    display_order INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index on form_type and subject_name
CREATE UNIQUE INDEX IF NOT EXISTS idx_interview_subject_templates_form_subject 
ON interview_subject_templates(form_type, subject_name);

-- Enable RLS
ALTER TABLE interview_subject_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON interview_subject_templates;
DROP POLICY IF EXISTS "Allow admin full access" ON interview_subject_templates;

-- Create RLS policies
CREATE POLICY "Allow public read access" ON interview_subject_templates
    FOR SELECT USING (true);

CREATE POLICY "Allow admin full access" ON interview_subject_templates
    FOR ALL USING (true);

-- Grant permissions
GRANT SELECT ON interview_subject_templates TO anon;
GRANT ALL PRIVILEGES ON interview_subject_templates TO authenticated;

-- Insert default subjects for both form types
INSERT INTO interview_subject_templates (form_type, subject_name, max_marks, display_order) VALUES
('admission', 'Mathematics', 25, 1),
('admission', 'English', 25, 2),
('admission', 'Science', 25, 3),
('interview', 'General Knowledge', 25, 1),
('interview', 'Communication Skills', 25, 2),
('interview', 'Problem Solving', 25, 3)
ON CONFLICT (form_type, subject_name) DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_interview_subject_templates_updated_at ON interview_subject_templates;
CREATE TRIGGER update_interview_subject_templates_updated_at
    BEFORE UPDATE ON interview_subject_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'interview_subject_templates table has been successfully recreated with correct schema';
END $$;