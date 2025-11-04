-- Fix RLS policies for school_features table

-- Enable RLS on school_features table if not already enabled
ALTER TABLE school_features ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to school_features" ON school_features;
DROP POLICY IF EXISTS "Allow authenticated users to insert school_features" ON school_features;
DROP POLICY IF EXISTS "Allow authenticated users to update school_features" ON school_features;
DROP POLICY IF EXISTS "Allow authenticated users to delete school_features" ON school_features;

-- Create RLS policies for school_features table
-- Allow public read access
CREATE POLICY "Allow public read access to school_features"
ON school_features FOR SELECT
TO public
USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert school_features"
ON school_features FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated users to update school_features"
ON school_features FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated users to delete school_features"
ON school_features FOR DELETE
TO authenticated
USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_school_features_display_order ON school_features(display_order);
CREATE INDEX IF NOT EXISTS idx_school_features_is_active ON school_features(is_active);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_school_features_updated_at ON school_features;
CREATE TRIGGER update_school_features_updated_at
    BEFORE UPDATE ON school_features
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();