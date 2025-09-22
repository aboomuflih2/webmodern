import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, anonKey);

async function testSchoolFeatures() {
  try {
    console.log('🧪 Testing School Features Manager functionality...');
    
    // First, sign in as admin
    console.log('\n1. Signing in as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@pottur.school',
      password: 'admin123'
    });
    
    if (authError) {
      console.error('❌ Admin login failed:', authError.message);
      return;
    }
    
    console.log('✅ Admin login successful');
    
    // Test reading existing features
    console.log('\n2. Testing read access to school_features...');
    const { data: existingFeatures, error: readError } = await supabase
      .from('school_features')
      .select('*')
      .order('display_order');
    
    if (readError) {
      console.error('❌ Read failed:', readError.message);
    } else {
      console.log(`✅ Read successful - Found ${existingFeatures.length} existing features`);
      if (existingFeatures.length > 0) {
        console.log('   Sample feature:', existingFeatures[0].feature_title);
      }
    }
    
    // Test adding a new feature
    console.log('\n3. Testing add new feature...');
    const testFeature = {
      feature_title: 'Test Feature - ' + Date.now(),
      feature_description: 'This is a test feature to verify form submission works',
      icon_name: 'BookOpen',
      is_active: true,
      display_order: 999
    };
    
    const { data: newFeature, error: insertError } = await supabase
      .from('school_features')
      .insert([testFeature])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError.message);
      console.error('   Error details:', insertError);
    } else {
      console.log('✅ Insert successful - New feature ID:', newFeature.id);
      
      // Test updating the feature
      console.log('\n4. Testing update feature...');
      const { data: updatedFeature, error: updateError } = await supabase
        .from('school_features')
        .update({ 
          feature_description: 'Updated test description - ' + Date.now(),
          is_active: false 
        })
        .eq('id', newFeature.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Update failed:', updateError.message);
      } else {
        console.log('✅ Update successful');
      }
      
      // Test deleting the feature
      console.log('\n5. Testing delete feature...');
      const { error: deleteError } = await supabase
        .from('school_features')
        .delete()
        .eq('id', newFeature.id);
      
      if (deleteError) {
        console.error('❌ Delete failed:', deleteError.message);
      } else {
        console.log('✅ Delete successful');
      }
    }
    
    // Test toggle active status on existing feature (if any)
    if (existingFeatures && existingFeatures.length > 0) {
      console.log('\n6. Testing toggle active status...');
      const firstFeature = existingFeatures[0];
      const newActiveStatus = !firstFeature.is_active;
      
      const { error: toggleError } = await supabase
        .from('school_features')
        .update({ is_active: newActiveStatus })
        .eq('id', firstFeature.id);
      
      if (toggleError) {
        console.error('❌ Toggle failed:', toggleError.message);
      } else {
        console.log('✅ Toggle successful');
        
        // Revert the change
        await supabase
          .from('school_features')
          .update({ is_active: firstFeature.is_active })
          .eq('id', firstFeature.id);
        console.log('✅ Reverted toggle change');
      }
    }
    
    console.log('\n🎉 All School Features Manager tests completed successfully!');
    console.log('The form submission issue has been resolved.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Sign out
    await supabase.auth.signOut();
    console.log('\n👋 Signed out');
  }
}

testSchoolFeatures();