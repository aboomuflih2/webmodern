-- Create user_roles table for admin authentication
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_roles' 
        AND policyname = 'Users can view their own roles'
    ) THEN
        CREATE POLICY "Users can view their own roles" ON user_roles
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_roles' 
        AND policyname = 'Admins can manage all roles'
    ) THEN
        CREATE POLICY "Admins can manage all roles" ON user_roles
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM user_roles ur 
                    WHERE ur.user_id = auth.uid() 
                    AND ur.role = 'admin'
                )
            );
    END IF;
END $$;

-- Grant permissions
GRANT SELECT ON user_roles TO anon, authenticated;
GRANT ALL ON user_roles TO service_role;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Insert admin user if it doesn't exist (using the existing admin user from auth.users)
DO $$
BEGIN
    -- Check if there's an admin user in auth.users and add them to user_roles
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@modernhss.com') THEN
        INSERT INTO user_roles (user_id, role)
        SELECT id, 'admin'
        FROM auth.users 
        WHERE email = 'admin@modernhss.com'
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;