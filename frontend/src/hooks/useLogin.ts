'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from './useUser';
import { LoginCredentials, UserSession } from '../types/user';


export const useLogin = () => {
  const { setUser } = useUser();
  const [session, setSession] = useState<UserSession | null>(null);

  const login = async (credentials: LoginCredentials) => {
    const { email, password } = credentials;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.session) {
        const { access_token, refresh_token, expires_in } = data.session;
        const expires_at = Math.floor(Date.now() / 1000) + expires_in;

        // Save session to state and localStorage
        const userSession: UserSession = { access_token, refresh_token, expires_at };
        setSession(userSession);
        localStorage.setItem('session', JSON.stringify(userSession));

        // Save user to state
        setUser(data.user);
      }

      return data;
    } catch (error: any) {
      console.error('Login error:', error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      localStorage.removeItem('session');
    } catch (error: any) {
      console.error('Logout error:', error.message);
    }
  };

  const refreshSession = async () => {
    if (!session?.refresh_token) return;

    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: session.refresh_token,
      });

      if (error) {
        console.error('Session refresh error:', error.message);
        logout();
        return;
      }

      if (data.session) {
        const { access_token, refresh_token, expires_in } = data.session;
        const expires_at = Math.floor(Date.now() / 1000) + expires_in;

        // Update session in state and localStorage
        const updatedSession: UserSession = { access_token, refresh_token, expires_at };
        setSession(updatedSession);
        localStorage.setItem('session', JSON.stringify(updatedSession));
      }
    } catch (error: any) {
      console.error('Error refreshing session:', error.message);
      logout();
    }
  };

  useEffect(() => {
    // Load session from localStorage on app load
    const storedSession = localStorage.getItem('session');
    if (storedSession) {
      const parsedSession: UserSession = JSON.parse(storedSession);
      setSession(parsedSession);

      // Check if the session is still valid
      if (parsedSession.expires_at < Math.floor(Date.now() / 1000)) {
        refreshSession();
      }
    }
  }, []);

  useEffect(() => {
    // Automatically refresh the session before it expires
    if (session) {
      const timeout = session.expires_at - Math.floor(Date.now() / 1000) - 60; // Refresh 1 minute before expiration
      const timer = setTimeout(refreshSession, timeout * 1000);

      return () => clearTimeout(timer);
    }
  }, [session]);

  return {
    session,
    login,
    logout,
    refreshSession,
  };
};