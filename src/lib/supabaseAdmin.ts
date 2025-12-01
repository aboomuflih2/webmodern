import { createClient } from '@supabase/supabase-js';

const isServer = typeof window === 'undefined';
const supabaseUrl = isServer ? process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL : undefined;
const supabaseServiceKey = isServer ? process.env.SUPABASE_SERVICE_ROLE_KEY : undefined;

export const supabaseAdmin = (isServer && supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : undefined as unknown as ReturnType<typeof createClient>;

export const uploadFileAsAdmin = async (bucket: string, path: string, file: File) => {
  throw new Error('Admin upload is not available in the browser');
};

export const deleteFileAsAdmin = async (bucket: string, paths: string[]) => {
  throw new Error('Admin delete is not available in the browser');
};
