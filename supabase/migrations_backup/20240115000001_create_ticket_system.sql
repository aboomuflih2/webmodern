-- Create gate_pass_tickets table
CREATE TABLE gate_pass_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gate_pass_request_id UUID NOT NULL REFERENCES gate_pass_requests(id) ON DELETE CASCADE,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    permitted_entry_date DATE NOT NULL,
    permitted_entry_time TIME NOT NULL,
    qr_code_data TEXT NOT NULL,
    pdf_file_path VARCHAR(500),
    issued_by UUID REFERENCES auth.users(id),
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    entry_logged_at TIMESTAMP WITH TIME ZONE,
    entry_status VARCHAR(20) DEFAULT 'pending' CHECK (entry_status IN ('pending', 'used', 'expired', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_gate_pass_tickets_request_id ON gate_pass_tickets(gate_pass_request_id);
CREATE INDEX idx_gate_pass_tickets_ticket_number ON gate_pass_tickets(ticket_number);
CREATE INDEX idx_gate_pass_tickets_entry_date ON gate_pass_tickets(permitted_entry_date);
CREATE INDEX idx_gate_pass_tickets_status ON gate_pass_tickets(entry_status);

-- Create school_configuration table
CREATE TABLE school_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name VARCHAR(200) NOT NULL,
    school_logo_url VARCHAR(500),
    primary_phone VARCHAR(20),
    secondary_phone VARCHAR(20),
    tertiary_phone VARCHAR(20),
    address TEXT,
    website VARCHAR(200),
    email VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to generate unique ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
BEGIN
    -- Get current year and month
    SELECT 
        'TKT-' || 
        TO_CHAR(NOW(), 'YYYY') || '-' ||
        LPAD((EXTRACT(MONTH FROM NOW()))::TEXT, 2, '0') || '-' ||
        LPAD((COUNT(*) + 1)::TEXT, 4, '0')
    INTO new_number
    FROM gate_pass_tickets 
    WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW());
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL THEN
        NEW.ticket_number := generate_ticket_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ticket_number
    BEFORE INSERT ON gate_pass_tickets
    FOR EACH ROW
    EXECUTE FUNCTION set_ticket_number();

-- Enable RLS on both tables
ALTER TABLE gate_pass_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_configuration ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gate_pass_tickets
CREATE POLICY "Allow authenticated users to read tickets" ON gate_pass_tickets
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to create tickets" ON gate_pass_tickets
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update tickets" ON gate_pass_tickets
    FOR UPDATE TO authenticated USING (true);

-- RLS Policies for school_configuration
CREATE POLICY "Allow authenticated users to read config" ON school_configuration
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin users to update config" ON school_configuration
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON gate_pass_tickets TO anon;
GRANT ALL PRIVILEGES ON gate_pass_tickets TO authenticated;
GRANT SELECT ON school_configuration TO anon;
GRANT ALL PRIVILEGES ON school_configuration TO authenticated;

-- Insert default school configuration
INSERT INTO school_configuration (
    school_name, 
    primary_phone, 
    secondary_phone, 
    tertiary_phone,
    address
) VALUES (
    'Pottur School',
    '+91-XXXX-XXXX',
    '+91-YYYY-YYYY', 
    '+91-ZZZZ-ZZZZ',
    'Pottur Village, Andhra Pradesh, India'
);

-- Create updated_at trigger for both tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gate_pass_tickets_updated_at
    BEFORE UPDATE ON gate_pass_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_school_configuration_updated_at
    BEFORE UPDATE ON school_configuration
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();