-- Add academic performance fields to plus_one_applications table
-- This migration adds fields to store 10th grade academic performance data

ALTER TABLE plus_one_applications 
ADD COLUMN IF NOT EXISTS tenth_total_marks INTEGER,
ADD COLUMN IF NOT EXISTS tenth_obtained_marks INTEGER,
ADD COLUMN IF NOT EXISTS tenth_percentage DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS tenth_grade VARCHAR(10),
ADD COLUMN IF NOT EXISTS tenth_result VARCHAR(20) DEFAULT 'pass',
ADD COLUMN IF NOT EXISTS mathematics_marks INTEGER,
ADD COLUMN IF NOT EXISTS science_marks INTEGER,
ADD COLUMN IF NOT EXISTS english_marks INTEGER,
ADD COLUMN IF NOT EXISTS social_science_marks INTEGER,
ADD COLUMN IF NOT EXISTS language_marks INTEGER,
ADD COLUMN IF NOT EXISTS additional_subject_1 VARCHAR(100),
ADD COLUMN IF NOT EXISTS additional_subject_1_marks INTEGER,
ADD COLUMN IF NOT EXISTS additional_subject_2 VARCHAR(100),
ADD COLUMN IF NOT EXISTS additional_subject_2_marks INTEGER;

-- Add comments to document the new fields
COMMENT ON COLUMN plus_one_applications.tenth_total_marks IS 'Total marks for 10th grade examination';
COMMENT ON COLUMN plus_one_applications.tenth_obtained_marks IS 'Total marks obtained in 10th grade';
COMMENT ON COLUMN plus_one_applications.tenth_percentage IS 'Percentage scored in 10th grade';
COMMENT ON COLUMN plus_one_applications.tenth_grade IS 'Grade obtained (A+, A, B+, etc.)';
COMMENT ON COLUMN plus_one_applications.tenth_result IS 'Result status (pass, fail, compartment)';
COMMENT ON COLUMN plus_one_applications.mathematics_marks IS 'Marks obtained in Mathematics';
COMMENT ON COLUMN plus_one_applications.science_marks IS 'Marks obtained in Science';
COMMENT ON COLUMN plus_one_applications.english_marks IS 'Marks obtained in English';
COMMENT ON COLUMN plus_one_applications.social_science_marks IS 'Marks obtained in Social Science';
COMMENT ON COLUMN plus_one_applications.language_marks IS 'Marks obtained in Second Language';
COMMENT ON COLUMN plus_one_applications.additional_subject_1 IS 'Name of additional subject 1';
COMMENT ON COLUMN plus_one_applications.additional_subject_1_marks IS 'Marks in additional subject 1';
COMMENT ON COLUMN plus_one_applications.additional_subject_2 IS 'Name of additional subject 2';
COMMENT ON COLUMN plus_one_applications.additional_subject_2_marks IS 'Marks in additional subject 2';