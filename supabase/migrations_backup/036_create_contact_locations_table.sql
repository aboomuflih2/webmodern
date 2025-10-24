-- Create contact_locations table for managing location links
CREATE TABLE contact_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    location_type VARCHAR(50) DEFAULT 'map' CHECK (location_type IN ('map', 'directions', 'street_view', 'other')),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX idx_contact_locations_active_order ON contact_locations(is_active, display_order);
CREATE INDEX idx_contact_locations_type ON contact_locations(location_type);

-- Enable RLS
ALTER TABLE contact_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Allow admin full access to contact_locations" ON contact_locations
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Allow public read access for active locations
CREATE POLICY "Allow public read access to active contact_locations" ON contact_locations
    FOR SELECT USING (is_active = true);

-- Grant permissions to authenticated and anon roles
GRANT SELECT ON contact_locations TO anon;
GRANT SELECT ON contact_locations TO authenticated;
GRANT ALL PRIVILEGES ON contact_locations TO authenticated;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_contact_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contact_locations_updated_at
    BEFORE UPDATE ON contact_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_locations_updated_at();

-- Insert sample data
INSERT INTO contact_locations (title, url, description, location_type, display_order) VALUES
('View on Google Maps', 'https://maps.google.com/?q=Pottur+School+Andhra+Pradesh', 'View our school location on Google Maps', 'map', 1),
('Get Directions', 'https://maps.google.com/dir//Pottur+School+Andhra+Pradesh', 'Get driving directions to our school', 'directions', 2),
('Street View', 'https://maps.google.com/?q=Pottur+School+Andhra+Pradesh&layer=c', 'Explore our campus with Street View', 'street_view', 3);