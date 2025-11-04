-- Add admin role for user with UUID 33a1a84d-e500-4c6f-be23-2da75c30e468

-- First, check if the user already exists in user_roles table and update if exists
UPDATE user_roles 
SET role = 'admin', updated_at = NOW()
WHERE user_id = '33a1a84d-e500-4c6f-be23-2da75c30e468';

-- If no rows were updated (user doesn't exist in user_roles), insert new record
INSERT INTO user_roles (user_id, role, created_at, updated_at)
SELECT '33a1a84d-e500-4c6f-be23-2da75c30e468', 'admin', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = '33a1a84d-e500-4c6f-be23-2da75c30e468'
);

-- Verify the operation
SELECT user_id, role, created_at, updated_at 
FROM user_roles 
WHERE user_id = '33a1a84d-e500-4c6f-be23-2da75c30e468';