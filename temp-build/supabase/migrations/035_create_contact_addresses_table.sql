-- Create contact_addresses table for managing multiple address cards
CREATE TABLE contact_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    address_line_1 VARCHAR(500) NOT NULL,
    address_line_2 VARCHAR(500),
    city VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(255) NOT NULL DEFAULT 'India',
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX idx_contact_addresses_active_order ON contact_addresses(is_active, display_order);

-- Enable RLS
ALTER TABLE contact_addresses ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Allow admin full access to contact_addresses" ON contact_addresses
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Allow public read access for active addresses
CREATE POLICY "Allow public read access to active contact_addresses" ON contact_addresses
    FOR SELECT USING (is_active = true);

-- Grant permissions to authenticated and anon roles
GRANT SELECT ON contact_addresses TO anon;
GRANT SELECT ON contact_addresses TO authenticated;
GRANT ALL PRIVILEGES ON contact_addresses TO authenticated;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_contact_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contact_addresses_updated_at
    BEFORE UPDATE ON contact_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_addresses_updated_at();

-- Insert sample data
INSERT INTO contact_addresses (title, address_line_1, address_line_2, city, state, postal_code, country, display_order) VALUES
('Main Campus', 'Pottur School Campus', 'Near Government Hospital', 'Pottur', 'Andhra Pradesh', '515701', 'India', 1),
('Administrative Office', 'School Administrative Block', 'First Floor', 'Pottur', 'Andhra Pradesh', '515701', 'India', 2);