import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { User, registerDevice, getUserInfo, getStoredToken, clearStoredToken } from '../services/authService';

interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUserInfo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isLoading: true,
  isAuthenticated: false,
  user: null,
  token: null,
  login: async () => {},
  logout: async () => {},
  refreshUserInfo: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

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

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = await getStoredToken();
        if (storedToken) {
          setToken(storedToken);
          const userData = await getUserInfo(storedToken);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        await logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isAuthenticated,
        user,
        token,
        login,
        logout,
        refreshUserInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 