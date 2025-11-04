-- Create board_members table
CREATE TABLE IF NOT EXISTS board_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  designation VARCHAR(255) NOT NULL,
  board_type VARCHAR(50) CHECK (board_type IN ('governing_board', 'board_of_directors')) NOT NULL,
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
CREATE TABLE IF NOT EXISTS social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES board_members(id) ON DELETE CASCADE,
  platform VARCHAR(50) CHECK (platform IN ('linkedin', 'twitter', 'facebook', 'instagram')) NOT NULL,
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on board_members
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;

-- Create policies for board_members
CREATE POLICY "Allow public read access to board_members" ON board_members FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert board_members" ON board_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update board_members" ON board_members FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete board_members" ON board_members FOR DELETE USING (auth.role() = 'authenticated');

-- Enable RLS on social_links
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

-- Create policies for social_links
CREATE POLICY "Allow public read access to social_links" ON social_links FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert social_links" ON social_links FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update social_links" ON social_links FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete social_links" ON social_links FOR DELETE USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_board_members_board_type ON board_members(board_type);
CREATE INDEX IF NOT EXISTS idx_board_members_is_active ON board_members(is_active);
CREATE INDEX IF NOT EXISTS idx_board_members_display_order ON board_members(display_order);
CREATE INDEX IF NOT EXISTS idx_social_links_member_id ON social_links(member_id);
CREATE INDEX IF NOT EXISTS idx_social_links_platform ON social_links(platform);