import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAdmissionFormsManagement() {
  console.log('🔍 Testing Admission Forms Management...');
  
  try {
    // Test 1: Check if admission_forms table exists and has data
    console.log('\n1. Checking admission_forms table...');
    const { data: formsData, error: formsError } = await supabase
      .from('admission_forms')
      .select('*');
    
    if (formsError) {
      console.error('❌ Error fetching admission_forms:', formsError.message);
      return;
    }
    
    console.log('✅ admission_forms table exists');
    console.log('📊 Forms data:', JSON.stringify(formsData, null, 2));
    
    // Test 2: Check if is_admin() function works
    console.log('\n2. Testing is_admin() function...');
    const { data: adminTest, error: adminError } = await supabase
      .rpc('is_admin');
    
    if (adminError) {
      console.error('❌ Error calling is_admin():', adminError.message);
    } else {
      console.log('✅ is_admin() function works, result:', adminTest);
    }
    
    // Test 3: Test form status update (simulate admin action)
    console.log('\n3. Testing form status update...');
    const { data: updateData, error: updateError } = await supabase
      .from('admission_forms')
      .update({ is_active: true })
      .eq('form_type', 'kg_std')
      .select();
    
    if (updateError) {
      console.error('❌ Error updating form status:', updateError.message);
    } else {
      console.log('✅ Form status update successful:', updateData);
    }
    
    // Test 4: Test academic year update
    console.log('\n4. Testing academic year update...');
    const { data: yearUpdateData, error: yearUpdateError } = await supabase
      .from('admission_forms')
      .update({ academic_year: '2026-27' })
      .eq('form_type', 'kg_std')
      .select();
    
    if (yearUpdateError) {
      console.error('❌ Error updating academic year:', yearUpdateError.message);
    } else {
      console.log('✅ Academic year update successful:', yearUpdateData);
    }
    
    // Test 5: Check user_roles table for admin functionality
    console.log('\n5. Checking user_roles table...');
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(5);
    
    if (rolesError) {
      console.error('❌ Error fetching user_roles:', rolesError.message);
    } else {
      console.log('✅ user_roles table accessible, sample data:', rolesData);
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

testAdmissionFormsManagement();