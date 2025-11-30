import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState({
          session,
          user: session?.user ?? null,
          loading: false
        });
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState({
        session,
        user: session?.user ?? null,
        loading: false
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const checkAdminRole = async (userId?: string): Promise<boolean> => {
    const userIdToCheck = userId || authState.user?.id;

    if (!userIdToCheck) {
      return false;
    }
    
    try {
      // Check if we have a valid session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (!session) {
        return false;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userIdToCheck)
        .eq('role', 'admin')
        .limit(1);
      
      const isAdmin = !error && data && data.length > 0;
      if (isAdmin) {
        const currentRole = (session.user.user_metadata as Record<string, unknown>)?.role as string | undefined;
        if (currentRole !== 'admin') {
          await supabase.auth.updateUser({ data: { role: 'admin' } });
        }
      }
      return isAdmin;
    } catch (err) {
      console.error('Error checking admin role:', err);
      return false;
    }
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    checkAdminRole,
  };
}
