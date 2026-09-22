import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { api } from '../services/api';

interface AuthContextType extends AuthState {
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('access_token'),
    isAuthenticated: !!localStorage.getItem('access_token'),
    isLoading: true,
  });

  const refreshProfile = async () => {
    try {
      const user = await api.auth.me();
      setState(prev => ({ ...prev, user, isAuthenticated: true, isLoading: false }));
    } catch (error) {
      console.error("Failed to fetch profile", error);
      logout();
    }
  };

  useEffect(() => {
    if (state.token) {
      refreshProfile();
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (token: string) => {
    localStorage.setItem('access_token', token);
    setState(prev => ({ ...prev, token, isAuthenticated: true, isLoading: true }));
    await refreshProfile();
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};