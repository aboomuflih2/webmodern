-- Create gate_pass_requests table
CREATE TABLE gate_pass_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    mobile_number VARCHAR(10) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    purpose VARCHAR(200) NOT NULL,
    designation VARCHAR(20) NOT NULL CHECK (designation IN ('parent', 'alumni', 'maintenance', 'other')),
    student_name VARCHAR(100),
    class VARCHAR(50),
    admission_number VARCHAR(20),
    person_to_meet VARCHAR(100),
    authorized_person VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_comments TEXT,
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_gate_pass_status ON gate_pass_requests(status);
CREATE INDEX idx_gate_pass_created_at ON gate_pass_requests(created_at DESC);
CREATE INDEX idx_gate_pass_designation ON gate_pass_requests(designation);
CREATE INDEX idx_gate_pass_email ON gate_pass_requests(email);
CREATE INDEX idx_gate_pass_mobile ON gate_pass_requests(mobile_number);

-- Enable Row Level Security
ALTER TABLE gate_pass_requests ENABLE ROW LEVEL SECURITY;

-- Policy for public submissions (allow anyone to insert)
CREATE POLICY "Allow public gate pass submissions" ON gate_pass_requests
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Policy for admin access (full access for authenticated admin users)
CREATE POLICY "Admin full access to gate pass requests" ON gate_pass_requests
    FOR ALL TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Policy for users to view their own submissions
CREATE POLICY "Users can view own submissions" ON gate_pass_requests
    FOR SELECT TO authenticated
    USING (email = auth.jwt() ->> 'email');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_gate_pass_requests_updated_at
    BEFORE UPDATE ON gate_pass_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT ON gate_pass_requests TO anon;
GRANT INSERT ON gate_pass_requests TO anon;
GRANT ALL PRIVILEGES ON gate_pass_requests TO authenticated;