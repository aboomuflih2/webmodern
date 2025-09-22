-- Fix RLS policies for in_memory table

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.in_memory;
DROP POLICY IF EXISTS "Allow public read access" ON public.in_memory;

-- Create new policies
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

-- Update permissions
GRANT SELECT, INSERT ON public.in_memory TO anon;
GRANT ALL PRIVILEGES ON public.in_memory TO authenticated;