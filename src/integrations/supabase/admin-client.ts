import { supabase } from './client';

// Admin operations use the regular browser client and rely on RLS policies (is_admin()).
// Service role keys must never be bundled with the client.
export const adminSupabase = supabase;
