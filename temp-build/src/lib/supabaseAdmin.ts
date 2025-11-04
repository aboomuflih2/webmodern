import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Admin client with service role key for privileged operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function to upload files with admin privileges
export const uploadFileAsAdmin = async (bucket: string, path: string, file: File) => {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file);
  
  return { data, error };
};

// Helper function to delete files with admin privileges
export const deleteFileAsAdmin = async (bucket: string, paths: string[]) => {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .remove(paths);
  
  return { data, error };
};