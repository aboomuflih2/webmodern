-- Create board_members table
CREATE TABLE board_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  designation VARCHAR(255) NOT NULL,
  board_type VARCHAR(50) NOT NULL CHECK (board_type IN ('governing_board', 'board_of_directors')),
  photo_url TEXT,
  bio TEXT,
  address TEXT,
  email VARCHAR(255),
  mobile VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create social_links table
CREATE TABLE social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('linkedin', 'twitter', 'facebook', 'instagram')),
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (member_id) REFERENCES board_members(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_board_members_board_type ON board_members(board_type);
CREATE INDEX idx_board_members_is_active ON board_members(is_active);
CREATE INDEX idx_board_members_display_order ON board_members(display_order);
CREATE INDEX idx_social_links_member_id ON social_links(member_id);

-- Set up RLS policies
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

-- Allow public read access for active members
CREATE POLICY "Public can view active board members" ON board_members
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view social links" ON social_links
  FOR SELECT USING (true);

-- Allow authenticated users (admins) full access
CREATE POLICY "Authenticated users can manage board members" ON board_members
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage social links" ON social_links
  FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT ON board_members TO anon;
GRANT SELECT ON social_links TO anon;
GRANT ALL PRIVILEGES ON board_members TO authenticated;
GRANT ALL PRIVILEGES ON social_links TO authenticated;

-- Insert sample data
INSERT INTO board_members (name, designation, board_type, bio, email, is_active, display_order) VALUES
('Dr. John Smith', 'Chairman', 'governing_board', 'Experienced educator with 20+ years in academic leadership.', 'chairman@school.edu', true, 1),
('Ms. Sarah Johnson', 'Vice Chairman', 'governing_board', 'Former principal with expertise in curriculum development.', 'vice.chairman@school.edu', true, 2),
('Mr. Michael Brown', 'Director of Operations', 'board_of_directors', 'Business leader with focus on educational excellence.', 'operations@school.edu', true, 1);