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
      console.log('❌ No user ID available for admin check');
      return false;
    }
    
    try {
      // Check if we have a valid session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('📋 Current session:', { session: session?.user?.email, sessionError });
      
      if (!session) {
        console.log('❌ No active session for admin check');
        return false;
      }
      

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userIdToCheck)
        .eq('role', 'admin')
        .limit(1);
      
      console.log('📊 checkAdminRole result:', { data, error });
      const isAdmin = !error && data && data.length > 0;
      console.log('✅ Final admin status:', isAdmin);
      return isAdmin;
    } catch (err) {
      console.error('❌ checkAdminRole error:', err);
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