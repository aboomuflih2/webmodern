import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAdminApplicationsFetch() {
  console.log('🔍 Testing Admin Applications Fetch...');
  
  try {
    // Test 1: Check KG STD applications
    console.log('1. Fetching KG STD applications...');
    const { data: kgStdData, error: kgStdError } = await supabase
      .from('kg_std_applications')
      .select('application_number, child_name, mobile_number, status, created_at')
      .order('created_at', { ascending: false });
    
    if (kgStdError) {
      console.error('❌ KG STD fetch error:', kgStdError.message);
    } else {
      console.log(`✅ KG STD applications found: ${kgStdData.length}`);
      if (kgStdData.length > 0) {
        console.log('Sample KG STD data:', kgStdData[0]);
      }
    }
    
    // Test 2: Check Plus One applications
    console.log('\n2. Fetching Plus One applications...');
    const { data: plusOneData, error: plusOneError } = await supabase
      .from('plus_one_applications')
      .select('application_number, full_name, mobile_number, status, stream, created_at')
      .order('created_at', { ascending: false });
    
    if (plusOneError) {
      console.error('❌ Plus One fetch error:', plusOneError.message);
    } else {
      console.log(`✅ Plus One applications found: ${plusOneData.length}`);
      if (plusOneData.length > 0) {
        console.log('Sample Plus One data:', plusOneData[0]);
      }
    }
    
    // Test 3: Combined data like in the admin component
    console.log('\n3. Testing combined applications fetch (like admin component)...');
    const kgStdDataMapped = kgStdData?.map(app => ({
      id: app.application_number,
      application_number: app.application_number,
      full_name: app.child_name, // Map child_name to full_name for consistency
      mobile_number: app.mobile_number,
      status: app.status,
      type: 'kg_std',
      created_at: app.created_at
    })) || [];
    
    const plusOneDataMapped = plusOneData?.map(app => ({
      id: app.application_number,
      application_number: app.application_number,
      full_name: app.full_name,
      mobile_number: app.mobile_number,
      status: app.status,
      type: 'plus_one',
      stream: app.stream,
      created_at: app.created_at
    })) || [];
    
    const combinedApplications = [...kgStdDataMapped, ...plusOneDataMapped]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    console.log(`✅ Combined applications total: ${combinedApplications.length}`);
    
    if (combinedApplications.length > 0) {
      console.log('\n📊 Sample combined applications:');
      combinedApplications.slice(0, 3).forEach((app, index) => {
        console.log(`${index + 1}. ${app.application_number} - ${app.full_name} (${app.type}) - ${app.status}`);
      });
    } else {
      console.log('⚠️  No applications found - this explains why admin dashboard is empty!');
    }
    
    return combinedApplications.length > 0;
    
  } catch (err) {
    console.error('❌ Test error:', err.message);
    return false;
  }
}

async function runTest() {
  const success = await testAdminApplicationsFetch();
  
  console.log('\n=== Test Summary ===');
  console.log('Admin Applications Fetch:', success ? '✅ WORKING' : '❌ NO DATA');
  
  if (!success) {
    console.log('\n💡 The admin dashboard is empty because there are no applications in the database.');
    console.log('💡 You may need to apply the sample data migration or submit test applications.');
  }
  
  process.exit(success ? 0 : 1);
}

runTest();