import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUserRoles() {
  try {
    console.log('🔍 Checking user roles and admin function...');
    
    // First, sign in as admin to get the user ID
    console.log('\n1. Getting admin user ID...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@pottur.school',
      password: 'admin123'
    });
    
    if (authError) {
      console.error('❌ Admin login failed:', authError.message);
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    const adminUserId = user.id;
    console.log('✅ Admin user ID:', adminUserId);
    
    await supabase.auth.signOut();
    
    // Check if user_roles table exists and has the admin user
    console.log('\n2. Checking user_roles table...');
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');
    
    if (rolesError) {
      console.error('❌ Error checking user_roles:', rolesError.message);
      
      // Try to create the user_roles table if it doesn't exist
      console.log('\n   Attempting to create user_roles table...');
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS user_roles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          role TEXT NOT NULL DEFAULT 'user',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id)
        );
        
        -- Enable RLS
        ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view their own role" ON user_roles
          FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Admin can manage all roles" ON user_roles
          FOR ALL USING (is_admin());
        
        -- Grant permissions
        GRANT ALL ON user_roles TO authenticated;
        GRANT ALL ON user_roles TO anon;
      `;
      
      // We'll need to apply this manually since we can't execute DDL directly
      console.log('   SQL to create user_roles table:');
      console.log(createTableSQL);
      
    } else {
      console.log(`✅ Found ${userRoles.length} user roles:`);
      userRoles.forEach(role => {
        console.log(`   - User ${role.user_id}: ${role.role}`);
      });
      
      // Check if admin user has admin role
      const adminRole = userRoles.find(role => role.user_id === adminUserId);
      if (adminRole) {
        console.log(`✅ Admin user has role: ${adminRole.role}`);
      } else {
        console.log('❌ Admin user does NOT have a role in user_roles table');
        
        // Add admin role for the user
        console.log('\n   Adding admin role for the user...');
        const { data: newRole, error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: adminUserId,
            role: 'admin'
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('❌ Failed to add admin role:', insertError.message);
        } else {
          console.log('✅ Admin role added successfully');
        }
      }
    }
    
    // Test the is_admin function directly
    console.log('\n3. Testing is_admin() function...');
    
    // Sign in as admin again
    await supabase.auth.signInWithPassword({
      email: 'admin@pottur.school',
      password: 'admin123'
    });
    
    // Try to call the function using RPC
    const { data: isAdminResult, error: funcError } = await supabase
      .rpc('is_admin');
    
    if (funcError) {
      console.error('❌ is_admin() function call failed:', funcError.message);
      
      // The function might not exist, let's try to create it
      console.log('\n   The is_admin() function might not exist. Creating it...');
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION is_admin()
        RETURNS BOOLEAN AS $$
        BEGIN
          -- Check if the current user has admin role
          RETURN EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
          );
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        -- Grant execute permissions
        GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
        GRANT EXECUTE ON FUNCTION is_admin() TO anon;
      `;
      
      console.log('   SQL to create is_admin() function:');
      console.log(createFunctionSQL);
      
    } else {
      console.log('✅ is_admin() function result:', isAdminResult);
    }
    
    await supabase.auth.signOut();
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkUserRoles();