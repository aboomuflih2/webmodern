-- Create in_memory table for memorial entries
CREATE TABLE public.in_memory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_url TEXT,
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.in_memory ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Allow public read access for displaying memorial entries
CREATE POLICY "Allow public read access" ON public.in_memory
    FOR SELECT USING (true);

-- Allow public insert access (for testing and admin)
CREATE POLICY "Allow public insert access" ON public.in_memory
    FOR INSERT WITH CHECK (true);

-- Allow authenticated users to update and delete (for admin)
CREATE POLICY "Allow authenticated users update delete" ON public.in_memory
    FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated users delete" ON public.in_memory
    FOR DELETE USING (true);

-- Grant permissions to anon and authenticated roles
GRANT SELECT, INSERT ON public.in_memory TO anon;
GRANT ALL PRIVILEGES ON public.in_memory TO authenticated;

-- Create index for display_order for better performance
CREATE INDEX idx_in_memory_display_order ON public.in_memory(display_order);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_in_memory_updated_at
    BEFORE UPDATE ON public.in_memory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();