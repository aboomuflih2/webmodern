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

async function testSchoolFeaturesManager() {
  console.log('🧪 Testing School Features Manager functionality...');
  
  try {
    // 1. Test anonymous read access first
    console.log('\n1. Testing anonymous read access...');
    const { data: publicData, error: publicError } = await supabase
      .from('school_features')
      .select('*')
      .order('display_order');
    
    if (publicError) {
      console.error('❌ Anonymous read failed:', publicError);
    } else {
      console.log('✅ Anonymous read successful, found', publicData.length, 'features');
    }
    
    // 2. Sign in as admin
    console.log('\n2. Signing in as admin...');
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
    
    // 3. Test authenticated read access
    console.log('\n3. Testing authenticated read access...');
    const { data: authReadData, error: authReadError } = await supabase
      .from('school_features')
      .select('*')
      .order('display_order');
    
    if (authReadError) {
      console.error('❌ Authenticated read failed:', authReadError);
    } else {
      console.log('✅ Authenticated read successful, found', authReadData.length, 'features');
    }
    
    // 4. Test INSERT operation (Add new feature)
    console.log('\n4. Testing INSERT operation...');
    const testFeature = {
      feature_title: 'Test Feature - Manager Test',
      feature_description: 'This is a test feature created by the manager test',
      icon_name: 'TestIcon',
      display_order: 999,
      is_active: true
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('school_features')
      .insert([testFeature])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      console.error('Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
    } else {
      console.log('✅ Insert successful, ID:', insertData.id);
      
      // 5. Test UPDATE operation
      console.log('\n5. Testing UPDATE operation...');
      const { data: updateData, error: updateError } = await supabase
        .from('school_features')
        .update({ 
          feature_title: 'Updated Test Feature - Manager Test',
          feature_description: 'This feature has been updated by the manager test'
        })
        .eq('id', insertData.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Update failed:', updateError);
      } else {
        console.log('✅ Update successful');
      }
      
      // 6. Test toggle active status
      console.log('\n6. Testing toggle active status...');
      const { error: toggleError } = await supabase
        .from('school_features')
        .update({ is_active: false })
        .eq('id', insertData.id);
      
      if (toggleError) {
        console.error('❌ Toggle active failed:', toggleError);
      } else {
        console.log('✅ Toggle active successful');
      }
      
      // 7. Test DELETE operation
      console.log('\n7. Testing DELETE operation...');
      const { error: deleteError } = await supabase
        .from('school_features')
        .delete()
        .eq('id', insertData.id);
      
      if (deleteError) {
        console.error('❌ Delete failed:', deleteError);
      } else {
        console.log('✅ Delete successful');
      }
    }
    
    // 8. Test current user session
    console.log('\n8. Testing current user session...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session check failed:', sessionError);
    } else {
      console.log('✅ Session active:', !!sessionData.session);
      if (sessionData.session) {
        console.log('Session user:', sessionData.session.user.email);
        console.log('Session metadata:', sessionData.session.user.user_metadata);
      }
    }
    
    // Sign out
    await supabase.auth.signOut();
    console.log('\n✅ Signed out successfully');
    
    console.log('\n🎉 School Features Manager testing completed!');
    console.log('\n📋 Summary:');
    console.log('- Anonymous users can read features (for public display)');
    console.log('- Admin users should be able to perform all CRUD operations');
    console.log('- If INSERT/UPDATE/DELETE failed, there\'s an RLS policy issue');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testSchoolFeaturesManager().catch(console.error);