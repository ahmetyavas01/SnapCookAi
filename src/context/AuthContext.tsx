import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { User, registerDevice, getUserInfo, getStoredToken, clearStoredToken } from '../services/authService';
import KeyManagementService from '../services/keyManagementService';
import { GOOGLE_CLOUD_API_KEY, OPENAI_API_KEY } from '@env';

interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUserInfo: () => Promise<void>;
  loading: boolean;
  error: string | null;
  initializeAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateDeviceId = async (): Promise<string> => {
    const deviceId = await Device.modelId();
    const platform = Platform.OS;
    const uniqueId = `${platform}-${deviceId}-${Date.now()}`;
    return uniqueId;
  };

  const login = async () => {
    try {
      setIsLoading(true);
      const deviceId = await generateDeviceId();
      const response = await registerDevice(deviceId);
      setToken(response.token);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await clearStoredToken();
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const refreshUserInfo = async () => {
    try {
      if (!token) return;
      const updatedUser = await getUserInfo(token);
      setUser(updatedUser);
    } catch (error) {
      console.error('Error refreshing user info:', error);
      if ((error as any)?.message === 'Invalid token') {
        await logout();
      }
    }
  };

  const initializeAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize API keys
      const keyManager = KeyManagementService.getInstance();
      await keyManager.setApiKey('GOOGLE_CLOUD', GOOGLE_CLOUD_API_KEY);
      await keyManager.setApiKey('OPENAI', OPENAI_API_KEY);

      const token = await getStoredToken();
      if (token) {
        const userData = await getUserInfo(token);
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during authentication');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  const value = {
    isLoading,
    isAuthenticated,
    user,
    token,
    login,
    logout,
    refreshUserInfo,
    loading,
    error,
    initializeAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 