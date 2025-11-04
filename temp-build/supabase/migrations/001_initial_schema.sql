-- Initial schema migration for Pottur School Connect
-- Generated from live database structure

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create hero_slides table
CREATE TABLE IF NOT EXISTS public.hero_slides (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    subtitle text,
    image_url text,
    button_text text,
    button_url text,
    order_index integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create news_posts table
CREATE TABLE IF NOT EXISTS public.news_posts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    content text,
    excerpt text,
    featured_image text,
    author_id uuid,
    category text,
    tags text[],
    is_published boolean DEFAULT false,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create admission_forms table
CREATE TABLE IF NOT EXISTS public.admission_forms (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    student_name text NOT NULL,
    parent_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    address text,
    grade text NOT NULL,
    previous_school text,
    status text DEFAULT 'pending',
    submitted_at timestamp with time zone DEFAULT now(),
    reviewed_at timestamp with time zone,
    reviewed_by uuid,
    notes text
);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admission_forms ENABLE ROW LEVEL SECURITY;

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON public.hero_slides TO anon;
GRANT SELECT ON public.news_posts TO anon;
GRANT INSERT ON public.admission_forms TO anon;

GRANT ALL PRIVILEGES ON public.user_roles TO authenticated;
GRANT ALL PRIVILEGES ON public.hero_slides TO authenticated;
GRANT ALL PRIVILEGES ON public.news_posts TO authenticated;
GRANT ALL PRIVILEGES ON public.admission_forms TO authenticated;

-- Create RLS policies
-- Hero slides: public read access
CREATE POLICY "Hero slides are viewable by everyone" ON public.hero_slides
    FOR SELECT USING (is_active = true);

-- News posts: public read access for published posts
CREATE POLICY "Published news posts are viewable by everyone" ON public.news_posts
    FOR SELECT USING (is_published = true);

-- Admission forms: users can insert their own forms
CREATE POLICY "Anyone can submit admission forms" ON public.admission_forms
    FOR INSERT WITH CHECK (true);

-- User roles: users can view their own roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);