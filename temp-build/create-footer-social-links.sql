-- Create footer_social_media_links table
CREATE TABLE IF NOT EXISTS footer_social_media_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform)
);

-- Enable Row Level Security
ALTER TABLE footer_social_media_links ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Public can read footer social media links" 
ON footer_social_media_links 
FOR SELECT 
USING (true);

-- Create policy for admin write access
CREATE POLICY "Admin can manage footer social media links" 
ON footer_social_media_links 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Grant permissions
GRANT ALL ON footer_social_media_links TO authenticated;
GRANT SELECT ON footer_social_media_links TO anon;

-- Insert sample data
INSERT INTO footer_social_media_links (platform, url, is_active, display_order) VALUES
('facebook', 'https://facebook.com/potturschool', true, 1),
('instagram', 'https://instagram.com/potturschool', true, 2)
ON CONFLICT (platform) DO NOTHING;