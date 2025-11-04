import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createFooterSocialLinksTable() {
  console.log('🚀 Setting up footer_social_media_links table...\n');

  try {
    // First, let's try to insert some test data to see if the table exists
    console.log('1. Testing if table exists...');
    
    const { data: existingData, error: testError } = await supabase
      .from('footer_social_media_links')
      .select('*')
      .limit(1);

    if (testError && testError.code === 'PGRST106') {
      console.log('❌ Table does not exist. We need to create it manually.');
      console.log('\n📋 Please run the following SQL in your Supabase SQL editor:');
      console.log('----------------------------------------');
      console.log(`
-- Create footer_social_media_links table
CREATE TABLE IF NOT EXISTS footer_social_media_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform)
);

-- Enable Row Level Security
ALTER TABLE footer_social_media_links ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Public can read footer social media links" 
ON footer_social_media_links 
FOR SELECT 
USING (true);

-- Create policy for admin write access
CREATE POLICY "Admin can manage footer social media links" 
ON footer_social_media_links 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Grant permissions
GRANT ALL ON footer_social_media_links TO authenticated;
GRANT SELECT ON footer_social_media_links TO anon;
      `);
      console.log('----------------------------------------');
      console.log('\nAfter running the SQL, run this script again to add sample data.');
      return;
    } else if (testError) {
      console.error('❌ Error testing table:', testError);
      return;
    } else {
      console.log('✅ Table exists!');
    }

    // Add sample data if table exists
    console.log('\n2. Adding sample data...');
    
    const { data: insertData, error: insertError } = await supabase
      .from('footer_social_media_links')
      .upsert([
        {
          platform: 'facebook',
          url: 'https://facebook.com/potturschool',
          is_active: true,
          display_order: 1
        },
        {
          platform: 'instagram',
          url: 'https://instagram.com/potturschool',
          is_active: true,
          display_order: 2
        },
        {
          platform: 'twitter',
          url: 'https://twitter.com/potturschool',
          is_active: true,
          display_order: 3
        }
      ], {
        onConflict: 'platform'
      })
      .select();

    if (insertError) {
      console.error('❌ Error inserting sample data:', insertError);
    } else {
      console.log('✅ Sample data added successfully:', insertData?.length, 'records');
    }

    // Test final result
    console.log('\n3. Testing final result...');
    
    const { data: finalData, error: finalError } = await supabase
      .from('footer_social_media_links')
      .select('*')
      .order('display_order');

    if (finalError) {
      console.error('❌ Error fetching final data:', finalError);
    } else {
      console.log(`✅ Final test successful! Found ${finalData?.length || 0} records:`);
      finalData?.forEach(link => {
        console.log(`   - ${link.platform}: ${link.url} (active: ${link.is_active})`);
      });
    }

    console.log('\n🎉 Footer social media links table setup completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createFooterSocialLinksTable();