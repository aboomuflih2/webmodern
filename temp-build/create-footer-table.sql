-- Create footer_social_media_links table safely
-- This will NOT affect any existing data or tables

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

-- Drop existing policies if they exist (safe operation)
DROP POLICY IF EXISTS "Public can read footer social media links" ON footer_social_media_links;
DROP POLICY IF EXISTS "Admin can manage footer social media links" ON footer_social_media_links;

-- Create policies
CREATE POLICY "Public can read footer social media links" 
ON footer_social_media_links FOR SELECT USING (true);

CREATE POLICY "Admin can manage footer social media links" 
ON footer_social_media_links FOR ALL 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Grant permissions
GRANT ALL ON footer_social_media_links TO authenticated;
GRANT SELECT ON footer_social_media_links TO anon;

-- Insert sample data (will not overwrite existing data due to ON CONFLICT)
INSERT INTO footer_social_media_links (platform, url, is_active, display_order) VALUES
('facebook', 'https://facebook.com/potturschool', true, 1),
('instagram', 'https://instagram.com/potturschool', true, 2),
('twitter', 'https://twitter.com/potturschool', true, 3),
('youtube', 'https://youtube.com/@potturschool', true, 4)
ON CONFLICT (platform) DO NOTHING;