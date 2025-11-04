-- Apply all Supabase migrations to PostgreSQL
-- This script consolidates all migration files for VPS deployment

-- Start transaction
BEGIN;

-- Create migration tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to check if migration was already applied
CREATE OR REPLACE FUNCTION migration_applied(migration_version VARCHAR(255))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM schema_migrations WHERE version = migration_version);
END;
$$ LANGUAGE plpgsql;

-- Function to mark migration as applied
CREATE OR REPLACE FUNCTION mark_migration_applied(migration_version VARCHAR(255))
RETURNS VOID AS $$
BEGIN
    INSERT INTO schema_migrations (version) VALUES (migration_version)
    ON CONFLICT (version) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Apply initial schema migration
DO $$
BEGIN
    IF NOT migration_applied('001_initial_schema') THEN
        RAISE NOTICE 'Applying migration: 001_initial_schema';
        
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255),
            full_name VARCHAR(255),
            role VARCHAR(50) DEFAULT 'student',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Schools table
        CREATE TABLE IF NOT EXISTS schools (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            address TEXT,
            phone VARCHAR(20),
            email VARCHAR(255),
            principal_id UUID REFERENCES users(id),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Classes table
        CREATE TABLE IF NOT EXISTS classes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(100) NOT NULL,
            school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
            teacher_id UUID REFERENCES users(id),
            academic_year VARCHAR(20),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Students table
        CREATE TABLE IF NOT EXISTS students (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            student_id VARCHAR(50) UNIQUE NOT NULL,
            class_id UUID REFERENCES classes(id),
            school_id UUID REFERENCES schools(id),
            date_of_birth DATE,
            parent_contact VARCHAR(20),
            address TEXT,
            enrollment_date DATE DEFAULT CURRENT_DATE,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Teachers table
        CREATE TABLE IF NOT EXISTS teachers (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            employee_id VARCHAR(50) UNIQUE NOT NULL,
            school_id UUID REFERENCES schools(id),
            subject VARCHAR(100),
            qualification VARCHAR(255),
            experience_years INTEGER DEFAULT 0,
            hire_date DATE DEFAULT CURRENT_DATE,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        PERFORM mark_migration_applied('001_initial_schema');
    END IF;
END
$$;

-- Apply RLS policies migration
DO $$
BEGIN
    IF NOT migration_applied('002_rls_policies') THEN
        RAISE NOTICE 'Applying migration: 002_rls_policies';
        
        -- Enable RLS on all tables
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
        ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
        ALTER TABLE students ENABLE ROW LEVEL SECURITY;
        ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
        
        -- Users policies
        CREATE POLICY "Users can view their own profile" ON users
            FOR SELECT USING (auth.uid() = id);
        
        CREATE POLICY "Users can update their own profile" ON users
            FOR UPDATE USING (auth.uid() = id);
        
        -- Schools policies
        CREATE POLICY "Anyone can view schools" ON schools
            FOR SELECT USING (true);
        
        -- Classes policies
        CREATE POLICY "Anyone can view classes" ON classes
            FOR SELECT USING (true);
        
        -- Students policies
        CREATE POLICY "Students can view their own data" ON students
            FOR SELECT USING (auth.uid() = user_id);
        
        -- Teachers policies
        CREATE POLICY "Teachers can view their own data" ON teachers
            FOR SELECT USING (auth.uid() = user_id);
        
        PERFORM mark_migration_applied('002_rls_policies');
    END IF;
END
$$;

-- Apply indexes migration
DO $$
BEGIN
    IF NOT migration_applied('003_indexes') THEN
        RAISE NOTICE 'Applying migration: 003_indexes';
        
        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
        CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
        CREATE INDEX IF NOT EXISTS idx_teachers_employee_id ON teachers(employee_id);
        CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON teachers(school_id);
        CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
        
        PERFORM mark_migration_applied('003_indexes');
    END IF;
END
$$;

-- Apply admin user migration
DO $$
BEGIN
    IF NOT migration_applied('004_admin_user') THEN
        RAISE NOTICE 'Applying migration: 004_admin_user';
        
        -- Insert default admin user
        INSERT INTO users (id, email, password_hash, full_name, role, is_active)
        VALUES (
            uuid_generate_v4(),
            'admin@potturschool.com',
            crypt('admin123', gen_salt('bf')),
            'System Administrator',
            'admin',
            true
        ) ON CONFLICT (email) DO NOTHING;
        
        PERFORM mark_migration_applied('004_admin_user');
    END IF;
END
$$;

-- Grant permissions to roles
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Commit transaction
COMMIT;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'All migrations applied successfully';
END
$$;