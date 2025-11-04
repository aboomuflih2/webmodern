-- Create missing tables and functions for Pottur School Connect
-- This script creates all missing database objects identified in the setup

-- 1. Create gate_pass_requests table
CREATE TABLE IF NOT EXISTS gate_pass_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    designation TEXT NOT NULL,
    purpose TEXT NOT NULL,
    date_of_visit DATE NOT NULL,
    time_of_visit TIME NOT NULL,
    mobile_number TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    id_proof_type TEXT NOT NULL,
    id_proof_number TEXT NOT NULL,
    id_proof_document_path TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create job_applications table
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    designation TEXT NOT NULL,
    qualification TEXT NOT NULL,
    experience_years INTEGER DEFAULT 0,
    current_salary DECIMAL(10,2),
    expected_salary DECIMAL(10,2),
    district TEXT NOT NULL,
    address TEXT NOT NULL,
    cv_file_path TEXT,
    cover_letter TEXT,
    additional_info TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create board_members table
CREATE TABLE IF NOT EXISTS board_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    designation TEXT NOT NULL,
    board_type TEXT NOT NULL CHECK (board_type IN ('management', 'academic', 'advisory')),
    bio TEXT,
    email TEXT,
    phone TEXT,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create news table (legacy)
CREATE TABLE IF NOT EXISTS news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_published BOOLEAN DEFAULT false,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category TEXT NOT NULL,
    gate_pass_request_id UUID REFERENCES gate_pass_requests(id) ON DELETE CASCADE,
    created_by TEXT,
    assigned_to TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create contact_page_content table
CREATE TABLE IF NOT EXISTS contact_page_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_name TEXT NOT NULL UNIQUE,
    title TEXT,
    content TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create contact_addresses table
CREATE TABLE IF NOT EXISTS contact_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_name TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT,
    phone TEXT,
    email TEXT,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create contact_locations table
CREATE TABLE IF NOT EXISTS contact_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create the is_admin function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the current user has admin role
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on is_admin function
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO anon;

-- 10. Enable RLS on all tables
ALTER TABLE gate_pass_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_locations ENABLE ROW LEVEL SECURITY;

-- 11. Create basic RLS policies for gate_pass_requests
CREATE POLICY "Allow anonymous insert gate pass" ON gate_pass_requests
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous select gate pass" ON gate_pass_requests
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow authenticated full access gate pass" ON gate_pass_requests
    FOR ALL TO authenticated USING (true);

-- 12. Create basic RLS policies for job_applications
CREATE POLICY "Allow anonymous insert job applications" ON job_applications
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow authenticated read job applications" ON job_applications
    FOR SELECT TO authenticated USING (true);

-- 13. Create basic RLS policies for board_members
CREATE POLICY "Public can view active board members" ON board_members
    FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Authenticated users can manage board members" ON board_members
    FOR ALL TO authenticated USING (true);

-- 14. Create basic RLS policies for other tables
CREATE POLICY "Public can view news" ON news
    FOR SELECT TO anon USING (is_published = true);

CREATE POLICY "Authenticated can manage news" ON news
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated can manage tickets" ON tickets
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Public can view contact content" ON contact_page_content
    FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Public can view contact addresses" ON contact_addresses
    FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Public can view contact locations" ON contact_locations
    FOR SELECT TO anon USING (is_active = true);

-- 15. Grant permissions
GRANT SELECT, INSERT ON gate_pass_requests TO anon;
GRANT ALL PRIVILEGES ON gate_pass_requests TO authenticated;

GRANT SELECT, INSERT ON job_applications TO anon;
GRANT ALL PRIVILEGES ON job_applications TO authenticated;

GRANT SELECT ON board_members TO anon;
GRANT ALL PRIVILEGES ON board_members TO authenticated;

GRANT SELECT ON news TO anon;
GRANT ALL PRIVILEGES ON news TO authenticated;

GRANT ALL PRIVILEGES ON tickets TO authenticated;

GRANT SELECT ON contact_page_content TO anon;
GRANT ALL PRIVILEGES ON contact_page_content TO authenticated;

GRANT SELECT ON contact_addresses TO anon;
GRANT ALL PRIVILEGES ON contact_addresses TO authenticated;

GRANT SELECT ON contact_locations TO anon;
GRANT ALL PRIVILEGES ON contact_locations TO authenticated;

-- 16. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gate_pass_status ON gate_pass_requests(status);
CREATE INDEX IF NOT EXISTS idx_gate_pass_created_at ON gate_pass_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gate_pass_email ON gate_pass_requests(email);

CREATE INDEX IF NOT EXISTS idx_job_applications_designation ON job_applications(designation);
CREATE INDEX IF NOT EXISTS idx_job_applications_district ON job_applications(district);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON job_applications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_board_members_board_type ON board_members(board_type);
CREATE INDEX IF NOT EXISTS idx_board_members_is_active ON board_members(is_active);
CREATE INDEX IF NOT EXISTS idx_board_members_display_order ON board_members(display_order);

-- 17. Add missing columns to existing tables
ALTER TABLE news_posts ADD COLUMN IF NOT EXISTS publication_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE academic_programs ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE gallery_photos ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE interview_subject_templates ADD COLUMN IF NOT EXISTS form_type TEXT DEFAULT 'standard';

-- Success message
SELECT 'All missing database objects have been created successfully!' as result;