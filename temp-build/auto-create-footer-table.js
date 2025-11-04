import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createFooterTable() {
  console.log('🚀 Creating footer_social_media_links table...')
  
  try {
    // First, let's test if we can connect to the database
    console.log('🔍 Testing database connection...')
    const { data: testData, error: testError } = await supabase
      .from('user_roles')
      .select('id')
      .limit(1)
    
    if (testError) {
      console.log('⚠️  Database connection test failed:', testError.message)
    } else {
      console.log('✅ Database connection successful')
    }

    // Try to check if the table already exists
    console.log('🔍 Checking if footer_social_media_links table exists...')
    const { data: existingData, error: checkError } = await supabase
      .from('footer_social_media_links')
      .select('id')
      .limit(1)

    if (!checkError) {
      console.log('✅ Table already exists!')
      console.log('📊 Testing data insertion...')
      
      // Try to insert a test record
      const { data: insertData, error: insertError } = await supabase
        .from('footer_social_media_links')
        .upsert([
          { platform: 'facebook', url: 'https://facebook.com/potturschool', is_active: true, display_order: 1 }
        ], { onConflict: 'platform' })
        .select()

      if (insertError) {
        console.log('❌ Insert test failed:', insertError.message)
        return false
      } else {
        console.log('✅ Table is working correctly!')
        return true
      }
    }

    if (checkError && checkError.code === '42P01') {
      console.log('📋 Table does not exist. Creating it now...')
      
      // Read the migration file
      const migrationSQL = fs.readFileSync('./supabase/migrations/071_create_footer_social_media_links.sql', 'utf8')
      
      console.log('📝 Executing table creation SQL...')
      
      // Split the SQL into individual statements and execute them one by one
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.substring(0, 50)}...`)
          
          // For CREATE TABLE, ALTER TABLE, etc., we need to use rpc
          if (statement.includes('CREATE TABLE') || statement.includes('ALTER TABLE') || 
              statement.includes('CREATE POLICY') || statement.includes('GRANT') ||
              statement.includes('DROP POLICY')) {
            
            const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
            if (error) {
              console.log(`⚠️  Statement failed: ${error.message}`)
            }
          } else if (statement.includes('INSERT INTO')) {
            // Handle INSERT statements differently
            try {
              // Parse the INSERT statement to extract values
              const insertMatch = statement.match(/INSERT INTO footer_social_media_links.*?VALUES\s*(.+)/s)
              if (insertMatch) {
                // For now, let's use the direct insert approach
                const sampleData = [
                  { platform: 'facebook', url: 'https://facebook.com/potturschool', is_active: true, display_order: 1 },
                  { platform: 'instagram', url: 'https://instagram.com/potturschool', is_active: true, display_order: 2 },
                  { platform: 'twitter', url: 'https://twitter.com/potturschool', is_active: true, display_order: 3 }
                ]
                
                const { error: insertError } = await supabase
                  .from('footer_social_media_links')
                  .upsert(sampleData, { onConflict: 'platform' })
                
                if (insertError) {
                  console.log('⚠️  Sample data insertion failed:', insertError.message)
                } else {
                  console.log('✅ Sample data inserted successfully')
                }
              }
            } catch (e) {
              console.log('⚠️  Insert statement handling failed:', e.message)
            }
          }
        }
      }

      // Test the table again
      console.log('🔍 Testing table creation...')
      const { data: finalTest, error: finalError } = await supabase
        .from('footer_social_media_links')
        .select('*')
        .limit(5)

      if (finalError) {
        console.log('❌ Table creation verification failed:', finalError.message)
        return false
      } else {
        console.log('✅ Table created and verified successfully!')
        console.log(`📊 Found ${finalTest.length} records`)
        return true
      }
    } else {
      console.log('❌ Unexpected error:', checkError.message)
      return false
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    return false
  }
}

// Run the setup
createFooterTable().then(success => {
  if (success) {
    console.log('\n🎉 Footer social media links setup completed successfully!')
    console.log('You can now test the social media links in your admin panel.')
  } else {
    console.log('\n⚠️  Setup incomplete. The table may need to be created manually.')
    console.log('\n📋 Manual SQL to run in Supabase Studio:')
    console.log('============================================================')
    try {
      const sql = fs.readFileSync('./supabase/migrations/071_create_footer_social_media_links.sql', 'utf8')
      console.log(sql)
    } catch (e) {
      console.log('Could not read migration file')
    }
    console.log('============================================================')
  }
  process.exit(success ? 0 : 1)
})