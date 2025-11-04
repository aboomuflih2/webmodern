-- Add admin role for user web.modernhss@gmail.com
-- User UUID: c323b782-1886-447d-be4e-13cefde8afc0

-- Delete any existing role for this user first
DELETE FROM public.user_roles WHERE user_id = 'c323b782-1886-447d-be4e-13cefde8afc0';

-- Insert admin role for the user
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
VALUES (
    'c323b782-1886-447d-be4e-13cefde8afc0',
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
WHERE ur.user_id = 'c323b782-1886-447d-be4e-13cefde8afc0';