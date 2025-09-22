import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInterviewSubjectsRLS() {
  console.log('🔍 Testing interview_subjects RLS policies...');
  
  try {
    // 1. Login as admin
    console.log('\n1. Logging in as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@modernhss.edu.in',
      password: 'admin123'
    });
    
    if (authError) {
      console.error('❌ Admin login failed:', authError);
      return;
    }
    
    console.log('✅ Admin login successful');
    console.log('User ID:', authData.user.id);
    console.log('User metadata:', authData.user.user_metadata);
    
    // 2. Test is_admin function directly
    console.log('\n2. Testing is_admin() function...');
    const { data: isAdminResult, error: isAdminError } = await supabase.rpc('is_admin');
    
    if (isAdminError) {
      console.error('❌ Error calling is_admin function:', isAdminError);
    } else {
      console.log('✅ is_admin() result:', isAdminResult);
    }
    
    // 3. Test reading from interview_subjects
    console.log('\n3. Testing SELECT from interview_subjects...');
    const { data: selectData, error: selectError } = await supabase
      .from('interview_subjects')
      .select('*')
      .limit(5);
    
    if (selectError) {
      console.error('❌ SELECT failed:', selectError);
    } else {
      console.log('✅ SELECT successful, found', selectData.length, 'records');
    }
    
    // 4. Test inserting into interview_subjects
    console.log('\n4. Testing INSERT into interview_subjects...');
    const testSubject = {
      application_id: '123e4567-e89b-12d3-a456-426614174000', // dummy UUID
      subject_name: 'Test Subject',
      marks: 20,
      max_marks: 25,
      application_type: 'kg_std'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('interview_subjects')
      .insert(testSubject)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ INSERT failed:', insertError);
      console.error('Error details:', JSON.stringify(insertError, null, 2));
    } else {
      console.log('✅ INSERT successful, ID:', insertData.id);
      
      // Clean up - delete the test record
      const { error: deleteError } = await supabase
        .from('interview_subjects')
        .delete()
        .eq('id', insertData.id);
      
      if (deleteError) {
        console.error('❌ Cleanup DELETE failed:', deleteError);
      } else {
        console.log('✅ Cleanup successful');
      }
    }
    
    // 5. Check user_roles table
    console.log('\n5. Checking user_roles table...');
    const { data: userRolesData, error: userRolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', authData.user.id);
    
    if (userRolesError) {
      console.error('❌ user_roles query failed:', userRolesError);
    } else {
      console.log('✅ user_roles data:', userRolesData);
    }
    
    // Sign out
    await supabase.auth.signOut();
    
    console.log('\n🎉 Interview subjects RLS testing completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testInterviewSubjectsRLS().catch(console.error);