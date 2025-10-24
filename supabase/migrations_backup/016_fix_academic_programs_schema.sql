-- Fix academic_programs table schema to match admin interface expectations

-- Drop the old table and recreate with correct schema
DROP TABLE IF EXISTS academic_programs CASCADE;

-- Create academic_programs table with correct schema
CREATE TABLE academic_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_title TEXT NOT NULL,
    short_description TEXT,
    full_description TEXT,
    detailed_description TEXT,
    subjects TEXT[],
    duration TEXT,
    main_image TEXT,
    icon_image TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE academic_programs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public read access" ON academic_programs FOR SELECT USING (true);
CREATE POLICY "Admin full access" ON academic_programs FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Grant permissions
GRANT SELECT ON academic_programs TO anon;
GRANT ALL PRIVILEGES ON academic_programs TO authenticated;

-- Insert initial academic program data
INSERT INTO academic_programs (program_title, short_description, full_description, subjects, duration, is_active, display_order) VALUES
(
    'Pre-School (KG 1 & KG 2)',
    'Foundation learning through play-based activities and early childhood development programs.',
    'Our Pre-School program provides a nurturing environment for children aged 3-5 years. We focus on developing social skills, basic literacy, numeracy, and creativity through structured play activities. Our experienced teachers create a safe and stimulating environment where children can explore, learn, and grow at their own pace.',
    ARRAY['Basic Literacy', 'Numeracy', 'Art & Craft', 'Music & Movement', 'Social Skills', 'Environmental Awareness'],
    '2 Years',
    true,
    1
),
(
    'Primary School (Standards 1 - 4)',
    'Building strong academic foundations with comprehensive curriculum and skill development.',
    'Our Primary School program focuses on building strong foundational skills in core subjects while fostering creativity and critical thinking. Students develop essential reading, writing, and mathematical skills through interactive learning methods. We emphasize character building, teamwork, and developing a love for learning that will serve them throughout their educational journey.',
    ARRAY['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi', 'Art Education', 'Physical Education', 'Computer Science'],
    '4 Years',
    true,
    2
),
(
    'UP School (Standards 5 - 7)',
    'Intermediate education focusing on academic excellence and personality development.',
    'The Upper Primary School program bridges elementary and secondary education, providing students with advanced learning opportunities. We focus on developing analytical thinking, research skills, and subject mastery. Students are encouraged to explore their interests through various co-curricular activities while maintaining academic excellence.',
    ARRAY['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi', 'Computer Science', 'Art Education', 'Physical Education', 'Environmental Studies'],
    '3 Years',
    true,
    3
),
(
    'Moral Studies',
    'Character development and ethical education integrated across all levels.',
    'Our Moral Studies program is integrated throughout all academic levels, focusing on character development, ethical values, and social responsibility. Students learn about integrity, compassion, respect, and civic duty through interactive discussions, real-life scenarios, and community service projects. This program helps shape well-rounded individuals who contribute positively to society.',
    ARRAY['Ethics & Values', 'Social Responsibility', 'Character Building', 'Community Service', 'Cultural Awareness', 'Leadership Skills'],
    'Ongoing',
    true,
    4
),
(
    'High School (Standards 8 - 10)',
    'Comprehensive secondary education preparing students for higher studies and board examinations.',
    'Our High School program provides comprehensive secondary education aligned with state board curriculum. Students receive intensive preparation for board examinations while developing critical thinking and problem-solving skills. We offer personalized attention, regular assessments, and career guidance to help students make informed decisions about their future academic paths.',
    ARRAY['English', 'Mathematics', 'Science (Physics, Chemistry, Biology)', 'Social Studies', 'Hindi', 'Computer Science', 'Physical Education', 'Art Education'],
    '3 Years',
    true,
    5
),
(
    'Higher Secondary (Plus One & Plus Two)',
    'Advanced education with stream specialization for college preparation and career readiness.',
    'Our Higher Secondary program offers specialized streams to prepare students for higher education and professional careers. Students can choose from Science, Commerce, or Arts streams based on their interests and career goals. We provide expert faculty, modern laboratories, and comprehensive study materials to ensure excellent board results and college admissions.',
    ARRAY['Science Stream (Physics, Chemistry, Mathematics/Biology)', 'Commerce Stream (Accountancy, Business Studies, Economics)', 'Arts Stream (History, Political Science, Economics, Psychology)'],
    '2 Years',
    true,
    6
);

-- Note: Storage policies will be configured separately through Supabase dashboard
-- as they require superuser privileges that are not available in local migrations