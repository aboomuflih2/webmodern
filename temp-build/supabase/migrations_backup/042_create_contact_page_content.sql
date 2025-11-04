-- Create contact page content management table
-- This table stores all dynamic content for the contact page

CREATE TABLE IF NOT EXISTS public.contact_page_content (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    content_type text NOT NULL, -- 'contact_info', 'office_hours', 'address', 'emergency', 'department'
    title text NOT NULL,
    content text NOT NULL,
    additional_data jsonb, -- For storing flexible data like phone numbers, emails, coordinates
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contact_page_content ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON public.contact_page_content TO anon;
GRANT ALL PRIVILEGES ON public.contact_page_content TO authenticated;

-- Create RLS policies
-- Public read access for active content
CREATE POLICY "Contact page content is viewable by everyone" ON public.contact_page_content
    FOR SELECT USING (is_active = true);

-- Admin full access
CREATE POLICY "Admin full access to contact page content" ON public.contact_page_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Insert default contact page content
INSERT INTO public.contact_page_content (content_type, title, content, additional_data, display_order) VALUES
('contact_info', 'Main Office', 'Contact our main office for general inquiries', '{"phone": "+91 9876543210", "email": "info@potturschool.edu"}', 1),
('contact_info', 'Admissions Office', 'For admission related queries', '{"phone": "+91 9876543211", "email": "admissions@potturschool.edu"}', 2),
('office_hours', 'Office Hours', 'Monday to Friday: 8:00 AM - 4:00 PM\nSaturday: 8:00 AM - 12:00 PM\nSunday: Closed', '{}', 1),
('address', 'School Address', 'Pottur Higher Secondary School\nPottur, Thrissur District\nKerala, India - 680301', '{"coordinates": {"lat": 10.5276, "lng": 76.2144}}', 1),
('emergency', 'Emergency Contact', 'For urgent matters outside office hours', '{"phone": "+91 9876543212", "email": "emergency@potturschool.edu"}', 1),
('department', 'Academic Department', 'For academic and curriculum related queries', '{"phone": "+91 9876543213", "email": "academics@potturschool.edu"}', 1),
('department', 'Sports Department', 'For sports and extracurricular activities', '{"phone": "+91 9876543214", "email": "sports@potturschool.edu"}', 2);