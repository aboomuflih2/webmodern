-- Fix RLS policies to allow anonymous users to submit admission forms

-- Allow anonymous users to insert into kg_std_applications
CREATE POLICY "Allow anonymous insert" ON kg_std_applications 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Allow anonymous users to insert into plus_one_applications
CREATE POLICY "Allow anonymous insert" ON plus_one_applications 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Allow anonymous users to insert contact submissions
CREATE POLICY "Allow anonymous insert" ON contact_submissions 
FOR INSERT 
TO anon 
WITH CHECK (true);