-- Add admin role for user web.modernhss@gmail.com
-- User UUID: a5b51b66-b105-498a-9c3c-0db97a37916e

-- Delete any existing role for this user first
DELETE FROM public.user_roles WHERE user_id = 'a5b51b66-b105-498a-9c3c-0db97a37916e';

-- Insert admin role for the user
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
VALUES (
    'a5b51b66-b105-498a-9c3c-0db97a37916e',
    'admin',
    NOW(),
    NOW()
);

-- Verify the insertion
SELECT 
    ur.user_id,
    ur.role,
    au.email,
    ur.created_at,
    ur.updated_at
FROM public.user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE ur.user_id = 'a5b51b66-b105-498a-9c3c-0db97a37916e';