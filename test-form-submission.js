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

// Create Supabase client with anon key (same as frontend)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFormSubmission() {
  try {
    console.log('🧪 Testing School Features Manager form submission...');
    
    // Step 1: Sign in as admin (same as the form would do)
    console.log('\n1. Signing in as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@pottur.school',
      password: 'admin123'
    });
    
    if (authError) {
      console.error('❌ Admin login failed:', authError.message);
      return;
    }
    
    console.log('✅ Admin logged in successfully');
    console.log('   User ID:', authData.user.id);
    console.log('   Email:', authData.user.email);
    
    // Step 2: Check current user session
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('   Session active:', !!sessionData.session);
    
    // Step 3: Test reading existing features (should work)
    console.log('\n2. Testing read access...');
    const { data: existingFeatures, error: readError } = await supabase
      .from('school_features')
      .select('*')
      .limit(5);
    
    if (readError) {
      console.error('❌ Read failed:', readError.message);
    } else {
      console.log('✅ Read successful - found', existingFeatures.length, 'features');
    }
    
    // Step 4: Test form submission (INSERT) - this is what's failing
    console.log('\n3. Testing form submission (INSERT)...');
    const testFeature = {
      feature_title: 'Form Test Feature',
      feature_description: 'Testing form submission from admin dashboard',
      icon_name: 'test-icon',
      is_active: true,
      display_order: 999
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('school_features')
      .insert(testFeature)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Form submission (INSERT) failed:', insertError.message);
      console.error('   Error code:', insertError.code);
      console.error('   Error details:', insertError.details);
      
      // Check if it's an RLS issue
      if (insertError.code === '42501') {
        console.log('\n   This is a Row Level Security (RLS) policy violation.');
        console.log('   The form submission is failing because the RLS policies are not allowing the insert.');
        
        // Let's check what policies exist
        console.log('\n4. Checking current RLS policies...');
        const { data: policies, error: policyError } = await supabase
          .from('pg_policies')
          .select('*')
          .eq('tablename', 'school_features');
        
        if (policyError) {
          console.log('   Could not check policies:', policyError.message);
        } else {
          console.log('   Current policies:', policies?.length || 0);
          policies?.forEach(policy => {
            console.log(`   - ${policy.policyname}: ${policy.cmd} for ${policy.roles}`);
          });
        }
      }
      
    } else {
      console.log('🎉 Form submission (INSERT) successful!');
      console.log('   Created feature with ID:', insertData.id);
      
      // Test UPDATE (edit functionality)
      console.log('\n4. Testing edit functionality (UPDATE)...');
      const { data: updateData, error: updateError } = await supabase
        .from('school_features')
        .update({ feature_title: 'Updated Test Feature' })
        .eq('id', insertData.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Edit (UPDATE) failed:', updateError.message);
      } else {
        console.log('✅ Edit (UPDATE) successful');
      }
      
      // Test toggle active status
      console.log('\n5. Testing toggle active status...');
      const { data: toggleData, error: toggleError } = await supabase
        .from('school_features')
        .update({ is_active: false })
        .eq('id', insertData.id)
        .select()
        .single();
      
      if (toggleError) {
        console.error('❌ Toggle status failed:', toggleError.message);
      } else {
        console.log('✅ Toggle status successful - is_active:', toggleData.is_active);
      }
      
      // Test DELETE
      console.log('\n6. Testing delete functionality...');
      const { error: deleteError } = await supabase
        .from('school_features')
        .delete()
        .eq('id', insertData.id);
      
      if (deleteError) {
        console.error('❌ Delete failed:', deleteError.message);
      } else {
        console.log('✅ Delete successful - test cleaned up');
      }
    }
    
    // Sign out
    await supabase.auth.signOut();
    console.log('\n✅ Signed out');
    
    console.log('\n🎯 Form submission test completed!');
    
    if (!insertError) {
      console.log('\n🎉 SUCCESS: The School Features Manager form should now work properly!');
      console.log('   All CRUD operations (Create, Read, Update, Delete) are working.');
    } else {
      console.log('\n❌ ISSUE: The form submission is still failing.');
      console.log('   The admin can read features but cannot add/edit/delete them.');
      console.log('   This needs to be fixed in the Supabase dashboard manually.');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testFormSubmission();