// =============================================================================
// File: frontend/src/context/AuthContext.tsx
// Purpose: Authentication context provider managing user session and state
// =============================================================================

import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);

  // Startup profile loading
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          // Fetch current profile using stored token (Axios automatically attaches it)
          const response = await api.get('/auth/me');
          setUser(response.data.data);
          setToken(savedToken);
        } catch (error) {
          // Failure cleans up session
          localStorage.removeItem('token');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    void initializeAuth();
  }, []);

  // Login handler
  const login = async (email: string, password: string): Promise<User> => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: loggedInUser, tokens } = response.data.data;
      
      localStorage.setItem('token', tokens.accessToken);
      setUser(loggedInUser);
      setToken(tokens.accessToken);
      return loggedInUser;
    } catch (error) {
      throw error;
    }
  };

  // Registration handler
  const register = async (payload: any): Promise<void> => {
    try {
      await api.post('/auth/register', payload);
    } catch (error) {
      throw error;
    }
  };

  // Logout handler
  const logout = async (): Promise<void> => {
    try {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        // Call backend logout endpoint (requires refresh token but we can pass mock or handle)
        // Wait, the backend logout takes `{ refreshToken }` in body.
        // But since we DO NOT implement refresh token flows, let's just clear localStorage.
        // Wait! The user says:
        // "Remove tokens during logout...
        // DO NOT IMPLEMENT: Refresh token flows, Refresh token APIs..."
        // So we can call backend logout with a placeholder, or just clear local storage.
        // Let's do both to be safe: try to make the call or just clear the token locally.
        // Actually, we can just clear local storage:
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      // Always clear local state on error too
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
