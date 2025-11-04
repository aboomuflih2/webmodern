-- Fix primary key constraints and ensure proper table setup

-- Ensure primary key constraints are properly set
ALTER TABLE news_posts DROP CONSTRAINT IF EXISTS news_posts_pkey;
ALTER TABLE news_posts ADD CONSTRAINT news_posts_pkey PRIMARY KEY (id);

ALTER TABLE hero_slides DROP CONSTRAINT IF EXISTS hero_slides_pkey;
ALTER TABLE hero_slides ADD CONSTRAINT hero_slides_pkey PRIMARY KEY (id);

ALTER TABLE academic_programs DROP CONSTRAINT IF EXISTS academic_programs_pkey;
ALTER TABLE academic_programs ADD CONSTRAINT academic_programs_pkey PRIMARY KEY (id);

ALTER TABLE testimonials DROP CONSTRAINT IF EXISTS testimonials_pkey;
ALTER TABLE testimonials ADD CONSTRAINT testimonials_pkey PRIMARY KEY (id);

ALTER TABLE contact_submissions DROP CONSTRAINT IF EXISTS contact_submissions_pkey;
ALTER TABLE contact_submissions ADD CONSTRAINT contact_submissions_pkey PRIMARY KEY (id);

-- Ensure all tables have proper UUID generation
ALTER TABLE news_posts ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE hero_slides ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE academic_programs ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE testimonials ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE contact_submissions ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Create simple test policies that allow all operations
DROP POLICY IF EXISTS "Allow all for testing" ON news_posts;
CREATE POLICY "Allow all for testing" ON news_posts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for testing" ON hero_slides;
CREATE POLICY "Allow all for testing" ON hero_slides FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for testing" ON academic_programs;
CREATE POLICY "Allow all for testing" ON academic_programs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for testing" ON testimonials;
CREATE POLICY "Allow all for testing" ON testimonials FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for testing" ON contact_submissions;
CREATE POLICY "Allow all for testing" ON contact_submissions FOR ALL USING (true) WITH CHECK (true);