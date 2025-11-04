-- Enhanced Academic Programs Schema Migration
-- Based on Academic Manager Technical Architecture

-- Drop existing table if exists
DROP TABLE IF EXISTS academic_programs CASCADE;

-- Create enhanced academic_programs table
CREATE TABLE academic_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_title VARCHAR(255) NOT NULL,
    short_description TEXT NOT NULL,
    full_description TEXT NOT NULL,
    main_image VARCHAR(500),
    category VARCHAR(50) NOT NULL CHECK (category IN ('pre-school', 'primary', 'up-school', 'high-school', 'higher-secondary', 'competitive')),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_academic_programs_category ON academic_programs(category);
CREATE INDEX idx_academic_programs_active ON academic_programs(is_active);
CREATE INDEX idx_academic_programs_order ON academic_programs(display_order);
CREATE INDEX idx_academic_programs_updated ON academic_programs(updated_at DESC);

-- Create audit logs table for tracking changes
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    table_name VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_action ON audit_logs(table_name, action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('program-images', 'program-images', true),
    ('program-thumbnails', 'program-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on academic_programs
ALTER TABLE academic_programs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for academic_programs
-- Allow public read access
CREATE POLICY "Allow public read access" ON academic_programs
    FOR SELECT USING (true);

-- Allow authenticated users with admin role to manage
CREATE POLICY "Allow admin full access" ON academic_programs
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role = 'admin'
        )
    );

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow admin users to read audit logs
CREATE POLICY "Allow admin read audit logs" ON audit_logs
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role = 'admin'
        )
    );

-- Allow system to insert audit logs
CREATE POLICY "Allow system insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Storage RLS Policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin update" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin delete" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for program-icons" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to program-icons" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can upload to program-icons" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update program-icons" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can update program-icons" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from program-icons" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can delete from program-icons" ON storage.objects;

-- Create new storage policies
CREATE POLICY "Allow public read access to program images" ON storage.objects
    FOR SELECT USING (bucket_id IN ('program-images', 'program-thumbnails', 'program-icons'));

CREATE POLICY "Allow admin upload to program buckets" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id IN ('program-images', 'program-thumbnails', 'program-icons') AND
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role = 'admin'
        )
    );

CREATE POLICY "Allow admin update in program buckets" ON storage.objects
    FOR UPDATE USING (
        bucket_id IN ('program-images', 'program-thumbnails', 'program-icons') AND
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role = 'admin'
        )
    );

CREATE POLICY "Allow admin delete from program buckets" ON storage.objects
    FOR DELETE USING (
        bucket_id IN ('program-images', 'program-thumbnails', 'program-icons') AND
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role = 'admin'
        )
    );

-- Allow anonymous users for testing (can be removed in production)
CREATE POLICY "Allow anon upload for testing" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id IN ('program-images', 'program-thumbnails', 'program-icons')
    );

CREATE POLICY "Allow anon update for testing" ON storage.objects
    FOR UPDATE USING (
        bucket_id IN ('program-images', 'program-thumbnails', 'program-icons')
    );

CREATE POLICY "Allow anon delete for testing" ON storage.objects
    FOR DELETE USING (
        bucket_id IN ('program-images', 'program-thumbnails', 'program-icons')
    );

-- Insert initial academic programs data
INSERT INTO academic_programs (program_title, short_description, full_description, category, display_order) VALUES
('Pre-School Education', 'Early childhood development and learning foundation', 'Our pre-school program focuses on holistic development of children aged 3-5 years, providing a nurturing environment that promotes cognitive, social, emotional, and physical growth through play-based learning and structured activities.', 'pre-school', 1),
('Primary School', 'Building strong academic fundamentals', 'Primary education from grades 1-5 emphasizes core subjects including Mathematics, Science, English, and Social Studies. Our curriculum is designed to develop critical thinking skills, creativity, and a love for learning through interactive teaching methods.', 'primary', 2),
('Upper Primary School', 'Advanced learning and skill development', 'Grades 6-8 focus on preparing students for higher secondary education with enhanced curriculum in Mathematics, Science, Languages, and Social Sciences. Students develop research skills, analytical thinking, and subject specialization.', 'up-school', 3),
('High School Education', 'Comprehensive secondary education', 'High school program for grades 9-10 provides comprehensive education following state board curriculum. Students prepare for board examinations while developing leadership skills, career awareness, and academic excellence.', 'high-school', 4),
('Higher Secondary', 'Specialized streams for career preparation', 'Grades 11-12 offer specialized streams in Science, Commerce, and Arts. Students receive focused preparation for competitive examinations and higher education with experienced faculty and modern facilities.', 'higher-secondary', 5),
('Competitive Coaching', 'Excellence in competitive examinations', 'Specialized coaching for JEE, NEET, UPSC, and other competitive examinations. Expert faculty, comprehensive study materials, and regular assessments ensure students achieve their career goals in engineering, medical, and civil services.', 'competitive', 6);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic updated_at
CREATE TRIGGER update_academic_programs_updated_at
    BEFORE UPDATE ON academic_programs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_id, table_name, action, record_id, old_values)
        VALUES (auth.uid(), TG_TABLE_NAME, TG_OP, OLD.id, to_jsonb(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_id, table_name, action, record_id, old_values, new_values)
        VALUES (auth.uid(), TG_TABLE_NAME, TG_OP, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_id, table_name, action, record_id, new_values)
        VALUES (auth.uid(), TG_TABLE_NAME, TG_OP, NEW.id, to_jsonb(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create audit trigger for academic_programs
CREATE TRIGGER audit_academic_programs_trigger
    AFTER INSERT OR UPDATE OR DELETE ON academic_programs
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

-- Grant permissions
GRANT SELECT ON academic_programs TO anon;
GRANT ALL PRIVILEGES ON academic_programs TO authenticated;
GRANT ALL PRIVILEGES ON audit_logs TO authenticated;

-- Grant sequence permissions if needed
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;