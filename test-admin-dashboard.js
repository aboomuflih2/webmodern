import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testAdminDashboard() {
  console.log('🔍 Testing Admin Dashboard Applications Fetch...');
  
  try {
    // Test the exact same query as the admin component
    console.log('\n1. Fetching KG STD applications (admin component query)...');
    const { data: kgStdData, error: kgStdError } = await supabase
      .from('kg_std_applications')
      .select('id, application_number, child_name, mobile_number, status, created_at')
      .order('created_at', { ascending: false });

    if (kgStdError) {
      console.log('❌ KG STD fetch error:', kgStdError.message);
      return false;
    }

    console.log(`✅ KG STD applications found: ${kgStdData?.length || 0}`);
    if (kgStdData && kgStdData.length > 0) {
      console.log('Sample KG STD data:', {
        application_number: kgStdData[0].application_number,
        child_name: kgStdData[0].child_name,
        mobile_number: kgStdData[0].mobile_number,
        status: kgStdData[0].status
      });
    }

    console.log('\n2. Fetching Plus One applications (admin component query)...');
    const { data: plusOneData, error: plusOneError } = await supabase
      .from('plus_one_applications')
      .select('id, application_number, full_name, mobile_number, status, created_at, stream')
      .order('created_at', { ascending: false });

    if (plusOneError) {
      console.log('❌ Plus One fetch error:', plusOneError.message);
      return false;
    }

    console.log(`✅ Plus One applications found: ${plusOneData?.length || 0}`);
    if (plusOneData && plusOneData.length > 0) {
      console.log('Sample Plus One data:', {
        application_number: plusOneData[0].application_number,
        full_name: plusOneData[0].full_name,
        mobile_number: plusOneData[0].mobile_number,
        status: plusOneData[0].status,
        stream: plusOneData[0].stream
      });
    }

    // Test combined applications (exactly like admin component)
    console.log('\n3. Testing combined applications (admin component logic)...');
    const combinedApplications = [
      ...(kgStdData || []).map(app => ({
        ...app,
        full_name: app.child_name, // Map child_name to full_name for consistency
        type: "kg_std",
      })),
      ...(plusOneData || []).map(app => ({
        ...app,
        type: "plus_one",
      }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log(`✅ Combined applications total: ${combinedApplications.length}`);
    
    if (combinedApplications.length > 0) {
      console.log('\n📊 Sample combined applications:');
      combinedApplications.slice(0, 3).forEach((app, index) => {
        console.log(`${index + 1}. ${app.application_number} - ${app.full_name} (${app.type}) - ${app.status}`);
      });
    }

    return combinedApplications.length > 0;
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    return false;
  }
}

async function runTest() {
  const success = await testAdminDashboard();
  
  console.log('\n=== Test Summary ===');
  console.log('Admin Dashboard Applications:', success ? '✅ WORKING' : '❌ FAILED');
  
  if (success) {
    console.log('\n🎉 The admin dashboard should now display all submitted applications!');
    console.log('💡 Applications are being fetched correctly from both tables.');
  } else {
    console.log('\n❌ There are still issues with the admin dashboard.');
  }
  
  process.exit(success ? 0 : 1);
}

runTest();