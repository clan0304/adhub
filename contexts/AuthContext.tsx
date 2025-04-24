/* eslint-disable @typescript-eslint/no-explicit-any */
// contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, UserSession } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AuthContextProps {
  session: UserSession | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{
    error: any | null;
    data: any | null;
  }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{
    error: any | null;
    data: any | null;
  }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        console.log('Initializing auth state...');
        const {
          data: { session: initialSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Error fetching session:', sessionError);
          if (mounted) {
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        if (initialSession && mounted) {
          try {
            const { data: userData, error: userError } =
              await supabase.auth.getUser();

            if (userError) {
              console.error('Error fetching user data:', userError);
            } else if (mounted && userData) {
              setSession({ user: userData.user, session: initialSession });
            }
          } catch (userFetchError) {
            console.error('Exception fetching user:', userFetchError);
          }
        }
      } catch (e) {
        console.error('Exception in auth initialization:', e);
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    }

    initializeAuth();

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, []);

  // Set up auth state change listener
  useEffect(() => {
    if (!initialized) return;

    console.log('Setting up auth listener...');
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);

        try {
          if (newSession) {
            const { data: userData, error: userError } =
              await supabase.auth.getUser();

            if (userError) {
              console.error(
                'Error fetching user data on state change:',
                userError
              );
              setSession(null);
            } else {
              setSession({ user: userData.user, session: newSession });
            }
          } else {
            setSession(null);
          }
        } catch (e) {
          console.error('Exception in auth state change:', e);
          setSession(null);
        }
      }
    );

    return () => {
      console.log('Cleaning up auth listener...');
      authListener.subscription.unsubscribe();
    };
  }, [initialized]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    console.log('Signing in with email and password...');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
      } else {
        console.log('Sign in successful');
      }

      return { data, error };
    } catch (err) {
      console.error('Exception during sign in:', err);
      return { data: null, error: err as any };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    console.log('Signing up with email and password...');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Sign up error:', error);
      } else {
        console.log('Sign up successful');
      }

      return { data, error };
    } catch (err) {
      console.error('Exception during sign up:', err);
      return { data: null, error: err as any };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    console.log('Signing in with Google...');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Google sign in error:', error);
        throw error;
      }
    } catch (err) {
      console.error('Exception during Google sign in:', err);
      throw err;
    }
  };

  const signOut = async () => {
    setLoading(true);
    console.log('Signing out...');

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Sign out error:', error);
      } else {
        console.log('Sign out successful');
        router.push('/auth');
      }
    } catch (err) {
      console.error('Exception during sign out:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
