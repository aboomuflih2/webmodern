-- Create in_memory table for memorial entries
-- This table stores information about deceased management members

CREATE TABLE IF NOT EXISTS public.in_memory (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_url text,
    name text NOT NULL,
    designation text NOT NULL,
    description text,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_in_memory_display_order ON public.in_memory(display_order);
CREATE INDEX IF NOT EXISTS idx_in_memory_created_at ON public.in_memory(created_at);

-- Enable Row Level Security
ALTER TABLE public.in_memory ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Allow public read access
CREATE POLICY "Allow public read access" ON public.in_memory
    FOR SELECT USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert" ON public.in_memory
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated update" ON public.in_memory
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated delete" ON public.in_memory
    FOR DELETE USING (auth.role() = 'authenticated');

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_in_memory_updated_at 
    BEFORE UPDATE ON public.in_memory 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();