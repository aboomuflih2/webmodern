const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAdminFunction() {
  try {
    console.log('🔧 Creating is_admin() function...\n');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.is_admin()
      RETURNS boolean
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        -- Check if the current user has admin role
        RETURN EXISTS (
          SELECT 1 
          FROM user_roles 
          WHERE user_id = auth.uid() 
          AND role = 'admin'
        );
      END;
      $$;
    `;
    
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: createFunctionSQL
    });
    
    if (error) {
      console.log('❌ Error creating is_admin() function:', error);
      
      // Try alternative method using direct SQL execution
      console.log('🔄 Trying alternative method...');
      
      const { data: altData, error: altError } = await supabaseAdmin
        .from('pg_proc')
        .select('*')
        .eq('proname', 'is_admin');
        
      if (altError) {
        console.log('❌ Alternative method failed:', altError);
      } else {
        console.log('✅ Function check result:', altData);
      }
    } else {
      console.log('✅ is_admin() function created successfully!');
      console.log('Result:', data);
    }
    
    // Test the function
    console.log('\n🧪 Testing is_admin() function...');
    const { data: testData, error: testError } = await supabaseAdmin.rpc('is_admin');
    
    if (testError) {
      console.log('❌ Function test failed:', testError);
    } else {
      console.log('✅ Function test successful! Result:', testData);
    }
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

createAdminFunction();