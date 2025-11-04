-- Create missing tables: profiles, gate_pass_applications, job_applications
-- These tables are referenced in the application but were missing from the database

-- 1. Profiles table (for user profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    email text,
    phone text,
    role text DEFAULT 'user',
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- 2. Gate Pass Applications table
CREATE TABLE IF NOT EXISTS public.gate_pass_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_number text UNIQUE NOT NULL,
    full_name text NOT NULL,
    phone text NOT NULL,
    email text,
    purpose text NOT NULL,
    visit_date date NOT NULL,
    visit_time time NOT NULL,
    id_proof_type text NOT NULL,
    id_proof_number text NOT NULL,
    id_proof_file text,
    photo_file text,
    status text DEFAULT 'pending',
    approved_by uuid,
    approved_at timestamptz,
    rejection_reason text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Job Applications table
CREATE TABLE IF NOT EXISTS public.job_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_number text UNIQUE NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    position text NOT NULL,
    experience_years integer DEFAULT 0,
    qualification text NOT NULL,
    cv_file text,
    cover_letter text,
    status text DEFAULT 'pending',
    applied_at timestamptz DEFAULT now(),
    reviewed_at timestamptz,
    reviewed_by uuid,
    interview_date date,
    interview_time time,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_pass_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for gate_pass_applications
CREATE POLICY "Public can insert gate pass applications" ON public.gate_pass_applications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can view all gate pass applications" ON public.gate_pass_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for job_applications
CREATE POLICY "Public can insert job applications" ON public.job_applications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can view all job applications" ON public.job_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Grant permissions
GRANT SELECT, INSERT ON public.profiles TO anon, authenticated;
GRANT SELECT, INSERT ON public.gate_pass_applications TO anon, authenticated;
GRANT SELECT, INSERT ON public.job_applications TO anon, authenticated;

-- Grant full access to authenticated users for their own data
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.gate_pass_applications TO authenticated;
GRANT ALL ON public.job_applications TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_gate_pass_applications_status ON public.gate_pass_applications(status);
CREATE INDEX IF NOT EXISTS idx_gate_pass_applications_visit_date ON public.gate_pass_applications(visit_date);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_position ON public.job_applications(position);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gate_pass_applications_updated_at BEFORE UPDATE ON public.gate_pass_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON public.job_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();