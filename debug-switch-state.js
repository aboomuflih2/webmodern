import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSwitchState() {
  console.log('🔍 Debugging Switch State Issues...');
  
  try {
    // 1. Check current forms data
    console.log('\n1. Fetching current admission forms data:');
    const { data: forms, error: formsError } = await supabase
      .from('admission_forms')
      .select('*')
      .order('form_type');
    
    if (formsError) {
      console.error('❌ Error fetching forms:', formsError.message);
      return;
    }
    
    console.log('📋 Current forms data:');
    forms.forEach(form => {
      console.log(`  - ${form.form_type}: is_active = ${form.is_active} (type: ${typeof form.is_active})`);
      console.log(`    Academic Year: ${form.academic_year}`);
      console.log(`    Created: ${form.created_at}`);
      console.log(`    Updated: ${form.updated_at}`);
    });
    
    // 2. Test boolean conversion
    console.log('\n2. Testing boolean conversion:');
    forms.forEach(form => {
      const boolValue = form.is_active || false;
      console.log(`  - ${form.form_type}: ${form.is_active} -> ${boolValue} (${typeof boolValue})`);
    });
    
    // 3. Test a status update
    console.log('\n3. Testing status update for kg_std form:');
    const kgStdForm = forms.find(f => f.form_type === 'kg_std');
    if (kgStdForm) {
      const newStatus = !kgStdForm.is_active;
      console.log(`  Current status: ${kgStdForm.is_active}`);
      console.log(`  New status: ${newStatus}`);
      
      const { data: updateData, error: updateError } = await supabase
        .from('admission_forms')
        .update({ is_active: newStatus })
        .eq('form_type', 'kg_std')
        .select();
      
      if (updateError) {
        console.error('❌ Update error:', updateError.message);
      } else {
        console.log('✅ Update successful:', updateData);
        
        // Verify the update
        const { data: verifyData } = await supabase
          .from('admission_forms')
          .select('*')
          .eq('form_type', 'kg_std')
          .single();
        
        console.log('🔍 Verification - Updated form:', verifyData);
        
        // Revert the change
        await supabase
          .from('admission_forms')
          .update({ is_active: kgStdForm.is_active })
          .eq('form_type', 'kg_std');
        
        console.log('↩️ Reverted change back to original state');
      }
    }
    
    // 4. Check table schema
    console.log('\n4. Checking table schema:');
    const { data: schemaData, error: schemaError } = await supabase
      .from('admission_forms')
      .select('*')
      .limit(1);
    
    if (schemaData && schemaData.length > 0) {
      console.log('📊 Table columns:', Object.keys(schemaData[0]));
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

debugSwitchState();