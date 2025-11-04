-- Drop existing job_applications table if it exists to avoid conflicts
DROP TABLE IF EXISTS job_applications CASCADE;

-- Create job_applications table with schema matching TypeScript interface
CREATE TABLE job_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    subject VARCHAR(100),
    other_designation VARCHAR(255),
    experience_years INTEGER NOT NULL DEFAULT 0,
    qualifications TEXT NOT NULL,
    district VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    cv_file_path VARCHAR(500),
    cover_letter TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for CV uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cv-uploads',
  'cv-uploads',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on job_applications table
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for job_applications
-- Allow anonymous users to insert job applications (public can apply)
CREATE POLICY "Allow anonymous insert job applications" ON job_applications
    FOR INSERT TO anon
    WITH CHECK (true);

-- Allow authenticated users to view all applications (for admin)
CREATE POLICY "Allow authenticated read job applications" ON job_applications
    FOR SELECT TO authenticated
    USING (true);

-- Allow authenticated users to update applications (for admin)
CREATE POLICY "Allow authenticated update job applications" ON job_applications
    FOR UPDATE TO authenticated
    USING (true);

-- Allow authenticated users to delete applications (for admin)
CREATE POLICY "Allow authenticated delete job applications" ON job_applications
    FOR DELETE TO authenticated
    USING (true);

-- Storage policies for CV uploads
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow anonymous upload CVs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated view CVs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete CVs" ON storage.objects;

-- Allow anonymous users to upload CVs
CREATE POLICY "Allow anonymous upload CVs" ON storage.objects
    FOR INSERT TO anon
    WITH CHECK (bucket_id = 'cv-uploads');

-- Allow authenticated users to view CVs (for admin)
CREATE POLICY "Allow authenticated view CVs" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'cv-uploads');

-- Allow authenticated users to delete CVs (for admin)
CREATE POLICY "Allow authenticated delete CVs" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'cv-uploads');

-- Grant permissions to anon and authenticated roles
GRANT SELECT, INSERT ON job_applications TO anon;
GRANT ALL PRIVILEGES ON job_applications TO authenticated;

-- Grant storage permissions
GRANT SELECT ON storage.buckets TO anon, authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT INSERT ON storage.objects TO anon;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_applications_designation ON job_applications(designation);
CREATE INDEX IF NOT EXISTS idx_job_applications_district ON job_applications(district);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON job_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_email ON job_applications(email);
CREATE INDEX IF NOT EXISTS idx_job_applications_phone ON job_applications(phone);

-- Create bulk import function
CREATE OR REPLACE FUNCTION bulk_import_job_applications(applications_data JSONB)
RETURNS TABLE(success BOOLEAN, message TEXT, imported_count INTEGER) AS $$
DECLARE
    app_record RECORD;
    imported_count INTEGER := 0;
    error_count INTEGER := 0;
    current_app JSONB;
BEGIN
    -- Validate input
    IF applications_data IS NULL OR jsonb_array_length(applications_data) = 0 THEN
        RETURN QUERY SELECT FALSE, 'No data provided for import', 0;
        RETURN;
    END IF;
    
    -- Loop through each application in the JSON array
    FOR app_record IN SELECT * FROM jsonb_array_elements(applications_data)
    LOOP
        BEGIN
            current_app := app_record.value;
            
            -- Insert each application with proper error handling
            INSERT INTO job_applications (
                full_name, email, phone, designation, subject, other_designation,
                experience_years, qualifications, district, address, cover_letter
            ) VALUES (
                trim(current_app->>'full_name'),
                trim(current_app->>'email'),
                trim(current_app->>'phone'),
                trim(current_app->>'designation'),
                NULLIF(trim(current_app->>'subject'), ''),
                NULLIF(trim(current_app->>'other_designation'), ''),
                COALESCE((current_app->>'experience_years')::INTEGER, 0),
                trim(current_app->>'qualifications'),
                trim(current_app->>'district'),
                trim(current_app->>'address'),
                NULLIF(trim(current_app->>'cover_letter'), '')
            );
            
            imported_count := imported_count + 1;
            
        EXCEPTION
            WHEN OTHERS THEN
                error_count := error_count + 1;
                CONTINUE;
        END;
    END LOOP;
    
    -- Return results
    IF imported_count > 0 THEN
        RETURN QUERY SELECT TRUE, 
            format('Successfully imported %s applications. %s records had errors.', 
                   imported_count, error_count), 
            imported_count;
    ELSE
        RETURN QUERY SELECT FALSE, 
            format('No applications were imported. %s records had errors.', error_count), 
            0;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT FALSE, 
            format('Bulk import failed: %s', SQLERRM), 
            0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION bulk_import_job_applications(JSONB) TO authenticated;