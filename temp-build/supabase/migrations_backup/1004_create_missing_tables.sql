-- Create missing tables to reach expected 30 tables
-- These definitions are intentionally straightforward and idempotent

-- 1) Gate Pass Requests
CREATE TABLE IF NOT EXISTS public.gate_pass_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  designation TEXT NOT NULL,
  purpose TEXT NOT NULL,
  date_of_visit DATE NOT NULL,
  time_of_visit TIME NOT NULL,
  mobile_number TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  id_proof_type TEXT NOT NULL,
  id_proof_number TEXT NOT NULL,
  id_proof_document_path TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Basic policies: allow anonymous submissions, authenticated read
ALTER TABLE public.gate_pass_requests ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gate_pass_requests' AND polname = 'gate_pass_anon_insert'
  ) THEN
    CREATE POLICY gate_pass_anon_insert ON public.gate_pass_requests FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gate_pass_requests' AND polname = 'gate_pass_auth_select'
  ) THEN
    CREATE POLICY gate_pass_auth_select ON public.gate_pass_requests FOR SELECT TO authenticated USING (true);
  END IF;
END$$;

-- 2) Job Applications
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  designation TEXT NOT NULL,
  qualification TEXT NOT NULL,
  experience_years INTEGER DEFAULT 0,
  current_salary NUMERIC(10,2),
  expected_salary NUMERIC(10,2),
  district TEXT NOT NULL,
  address TEXT NOT NULL,
  cv_file_path TEXT,
  cover_letter TEXT,
  additional_info TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','reviewed','shortlisted','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'job_applications' AND polname = 'job_apps_anon_insert'
  ) THEN
    CREATE POLICY job_apps_anon_insert ON public.job_applications FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'job_applications' AND polname = 'job_apps_auth_select'
  ) THEN
    CREATE POLICY job_apps_auth_select ON public.job_applications FOR SELECT TO authenticated USING (true);
  END IF;
END$$;

-- 3) Board Members
CREATE TABLE IF NOT EXISTS public.board_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  board_type TEXT NOT NULL CHECK (board_type IN ('management','academic','advisory')),
  bio TEXT,
  email TEXT,
  phone TEXT,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'board_members' AND polname = 'board_members_public_view'
  ) THEN
    CREATE POLICY board_members_public_view ON public.board_members FOR SELECT TO anon USING (is_active = true);
  END IF;
END$$;

-- 4) News (legacy/simple)
CREATE TABLE IF NOT EXISTS public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  is_published BOOLEAN DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'news' AND polname = 'news_public_view'
  ) THEN
    CREATE POLICY news_public_view ON public.news FOR SELECT TO anon USING (is_published = true);
  END IF;
END$$;

-- 5) Tickets
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  category TEXT NOT NULL,
  gate_pass_request_id UUID REFERENCES public.gate_pass_requests(id) ON DELETE CASCADE,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tickets' AND polname = 'tickets_auth_manage'
  ) THEN
    CREATE POLICY tickets_auth_manage ON public.tickets FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END$$;

-- 6) Contact Page Content
CREATE TABLE IF NOT EXISTS public.contact_page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contact_page_content ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contact_page_content' AND polname = 'contact_content_public_view'
  ) THEN
    CREATE POLICY contact_content_public_view ON public.contact_page_content FOR SELECT TO anon USING (is_active = true);
  END IF;
END$$;

-- 7) Contact Addresses
CREATE TABLE IF NOT EXISTS public.contact_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  district TEXT,
  pincode TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contact_addresses ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contact_addresses' AND polname = 'contact_addresses_public_view'
  ) THEN
    CREATE POLICY contact_addresses_public_view ON public.contact_addresses FOR SELECT TO anon USING (is_active = true);
  END IF;
END$$;

-- 8) Contact Locations
CREATE TABLE IF NOT EXISTS public.contact_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contact_locations ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contact_locations' AND polname = 'contact_locations_public_view'
  ) THEN
    CREATE POLICY contact_locations_public_view ON public.contact_locations FOR SELECT TO anon USING (is_active = true);
  END IF;
END$$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_gate_pass_status ON public.gate_pass_requests(status);
CREATE INDEX IF NOT EXISTS idx_gate_pass_created_at ON public.gate_pass_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_designation ON public.job_applications(designation);
CREATE INDEX IF NOT EXISTS idx_job_applications_district ON public.job_applications(district);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON public.job_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_board_members_board_type ON public.board_members(board_type);
CREATE INDEX IF NOT EXISTS idx_board_members_is_active ON public.board_members(is_active);
CREATE INDEX IF NOT EXISTS idx_board_members_display_order ON public.board_members(display_order);

-- End of migration