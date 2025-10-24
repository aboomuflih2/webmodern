-- Migration to restore 16 missing tables
-- Created: $(date)

-- 1. Academic Programs Table
CREATE TABLE IF NOT EXISTS academic_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_name TEXT NOT NULL,
    program_description TEXT NOT NULL,
    duration TEXT NOT NULL,
    eligibility_criteria TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Article Comments Table
CREATE TABLE IF NOT EXISTS article_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    comment_content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Article Likes Table
CREATE TABLE IF NOT EXISTS article_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL,
    user_ip TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id, user_ip)
);

-- 4. Breaking News Table
CREATE TABLE IF NOT EXISTS breaking_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Contact Submissions Table
CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Events Table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    location TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Gallery Photos Table
CREATE TABLE IF NOT EXISTS gallery_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Interview Subject Templates Table
CREATE TABLE IF NOT EXISTS interview_subject_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name TEXT NOT NULL,
    subject_list TEXT[] NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Interview Subjects Table
CREATE TABLE IF NOT EXISTS interview_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL,
    subject_name TEXT NOT NULL,
    marks_obtained INTEGER,
    max_marks INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. KG Standard Applications Table
CREATE TABLE IF NOT EXISTS kg_std_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_number TEXT UNIQUE NOT NULL,
    child_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT NOT NULL,
    father_name TEXT NOT NULL,
    mother_name TEXT NOT NULL,
    guardian_name TEXT,
    house_name TEXT NOT NULL,
    village TEXT NOT NULL,
    post_office TEXT NOT NULL,
    district TEXT NOT NULL,
    pincode TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    email TEXT,
    previous_school TEXT,
    status TEXT DEFAULT 'pending',
    interview_date DATE,
    interview_time TIME,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Leadership Messages Table
CREATE TABLE IF NOT EXISTS leadership_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_name TEXT NOT NULL,
    person_title TEXT NOT NULL,
    position TEXT NOT NULL,
    message_content TEXT NOT NULL,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Page Content Table
CREATE TABLE IF NOT EXISTS page_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_key TEXT UNIQUE NOT NULL,
    page_title TEXT NOT NULL,
    content TEXT NOT NULL,
    meta_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Plus One Applications Table
CREATE TABLE IF NOT EXISTS plus_one_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT NOT NULL,
    father_name TEXT NOT NULL,
    mother_name TEXT NOT NULL,
    house_name TEXT NOT NULL,
    village TEXT NOT NULL,
    post_office TEXT NOT NULL,
    district TEXT NOT NULL,
    pincode TEXT NOT NULL,
    landmark TEXT,
    mobile_number TEXT NOT NULL,
    email TEXT,
    tenth_school TEXT NOT NULL,
    board TEXT NOT NULL,
    exam_year TEXT NOT NULL,
    exam_roll_number TEXT NOT NULL,
    stream TEXT NOT NULL,
    has_siblings BOOLEAN,
    siblings_names TEXT,
    status TEXT DEFAULT 'pending',
    interview_date DATE,
    interview_time TIME,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. School Features Table
CREATE TABLE IF NOT EXISTS school_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_title TEXT NOT NULL,
    feature_description TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. School Stats Table
CREATE TABLE IF NOT EXISTS school_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    value INTEGER NOT NULL,
    suffix TEXT,
    icon_name TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Social Media Links Table
CREATE TABLE IF NOT EXISTS social_media_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Staff Counts Table
CREATE TABLE IF NOT EXISTS staff_counts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teaching_staff INTEGER DEFAULT 0,
    professional_staff INTEGER DEFAULT 0,
    security_staff INTEGER DEFAULT 0,
    guides_staff INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Testimonials Table
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_name TEXT NOT NULL,
    relation TEXT NOT NULL,
    quote TEXT NOT NULL,
    rating INTEGER,
    photo TEXT,
    is_active BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'pending',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE academic_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE breaking_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_subject_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE kg_std_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE leadership_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE plus_one_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for public read access
CREATE POLICY "Public read access" ON academic_programs FOR SELECT USING (true);
CREATE POLICY "Public read access" ON article_comments FOR SELECT USING (true);
CREATE POLICY "Public read access" ON article_likes FOR SELECT USING (true);
CREATE POLICY "Public read access" ON breaking_news FOR SELECT USING (true);
CREATE POLICY "Public read access" ON contact_submissions FOR SELECT USING (true);
CREATE POLICY "Public read access" ON events FOR SELECT USING (true);
CREATE POLICY "Public read access" ON gallery_photos FOR SELECT USING (true);
CREATE POLICY "Public read access" ON interview_subject_templates FOR SELECT USING (true);
CREATE POLICY "Public read access" ON interview_subjects FOR SELECT USING (true);
CREATE POLICY "Public read access" ON kg_std_applications FOR SELECT USING (true);
CREATE POLICY "Public read access" ON leadership_messages FOR SELECT USING (true);
CREATE POLICY "Public read access" ON page_content FOR SELECT USING (true);
CREATE POLICY "Public read access" ON plus_one_applications FOR SELECT USING (true);
CREATE POLICY "Public read access" ON school_features FOR SELECT USING (true);
CREATE POLICY "Public read access" ON school_stats FOR SELECT USING (true);
CREATE POLICY "Public read access" ON social_media_links FOR SELECT USING (true);
CREATE POLICY "Public read access" ON staff_counts FOR SELECT USING (true);
CREATE POLICY "Public read access" ON testimonials FOR SELECT USING (true);

-- Create admin access policies
CREATE POLICY "Admin full access" ON academic_programs FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON article_comments FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON article_likes FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON breaking_news FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON contact_submissions FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON events FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON gallery_photos FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON interview_subject_templates FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON interview_subjects FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON kg_std_applications FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON leadership_messages FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON page_content FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON plus_one_applications FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON school_features FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON school_stats FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON social_media_links FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON staff_counts FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON testimonials FOR ALL USING (auth.jwt() ->> 'role' = 'admin');