import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkNewsSchema() {
  console.log('🔍 Checking news_posts table schema\n');
  console.log('=' .repeat(60));

  try {
    // Check if news_posts table exists and get its structure
    console.log('\n📋 Checking news_posts table structure:');
    
    // Try to get table info using information_schema
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'news_posts')
      .eq('table_schema', 'public');

    if (columnsError) {
      console.log('   ⚠️  Error querying information_schema:', columnsError.message);
      
      // Fallback: Try to query the table directly to see what happens
      console.log('\n🔄 Trying direct table query...');
      const { data: newsData, error: newsError } = await supabase
        .from('news_posts')
        .select('*')
        .limit(1);
      
      if (newsError) {
        console.log('   ❌ Error querying news_posts table:', newsError.message);
        if (newsError.code === '42P01') {
          console.log('   📝 Table does not exist!');
        }
      } else {
        console.log('   ✅ Table exists and can be queried');
        console.log('   📊 Sample data structure:', Object.keys(newsData[0] || {}));
      }
    } else {
      console.log('   ✅ Found news_posts table with columns:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      
      // Check specifically for publication_date
      const hasPublicationDate = columns.some(col => col.column_name === 'publication_date');
      console.log(`\n📅 publication_date column: ${hasPublicationDate ? '✅ EXISTS' : '❌ MISSING'}`);
    }

    // Check what the CampusNews component expects
    console.log('\n🔍 Checking CampusNews component expectations...');
    
    // Try a query that includes publication_date to see the exact error
    console.log('\n🧪 Testing query with publication_date:');
    const { data: testData, error: testError } = await supabase
      .from('news_posts')
      .select('id, title, content, publication_date, created_at')
      .limit(1);
    
    if (testError) {
      console.log('   ❌ Error:', testError.message);
      console.log('   🔧 This confirms the publication_date column is missing');
    } else {
      console.log('   ✅ Query successful - publication_date exists');
    }

    // Check existing data to understand current structure
    console.log('\n📊 Checking existing news_posts data:');
    const { data: existingData, error: existingError } = await supabase
      .from('news_posts')
      .select('*')
      .limit(3);
    
    if (existingError) {
      console.log('   ❌ Error fetching data:', existingError.message);
    } else {
      console.log(`   📈 Found ${existingData.length} records`);
      if (existingData.length > 0) {
        console.log('   🗂️  Available columns:', Object.keys(existingData[0]).join(', '));
        console.log('   📝 Sample record:', JSON.stringify(existingData[0], null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Schema check completed');
}

// Run the schema check
checkNewsSchema().catch(console.error);