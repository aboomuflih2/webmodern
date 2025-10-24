-- Grant permissions to anon and authenticated roles for all tables

-- Grant permissions for admission_forms table
GRANT ALL PRIVILEGES ON admission_forms TO anon;
GRANT ALL PRIVILEGES ON admission_forms TO authenticated;

-- Grant permissions for news_posts table
GRANT ALL PRIVILEGES ON news_posts TO anon;
GRANT ALL PRIVILEGES ON news_posts TO authenticated;

-- Grant permissions for hero_slides table
GRANT ALL PRIVILEGES ON hero_slides TO anon;
GRANT ALL PRIVILEGES ON hero_slides TO authenticated;

-- Grant permissions for user_roles table
GRANT ALL PRIVILEGES ON user_roles TO anon;
GRANT ALL PRIVILEGES ON user_roles TO authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;