import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: number;
  deviceId: string;
  credits: number;
  isPremium: boolean;
  usageHistory: {
    feature: string;
    timestamp: Date;
    details?: any;
  }[];
}

interface AuthResponse {
  token: string;
  user: User;
}

export async function registerDevice(deviceId: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_URL}/api/auth/register-device`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deviceId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to register device');
    }

    const data = await response.json();
    await AsyncStorage.setItem('auth_token', data.token);
    return data;
  } catch (error) {
    console.error('Error in registerDevice:', error);
    throw error;
  }
}

export async function getUserInfo(token: string): Promise<User> {
  try {
    const response = await fetch(`${API_URL}/api/auth/user-info`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get user info');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error in getUserInfo:', error);
    throw error;
  }
}

export async function getStoredToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch (error) {
    console.error('Error getting stored token:', error);
    return null;
  }
}

export async function clearStoredToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem('auth_token');
  } catch (error) {
    console.error('Error clearing stored token:', error);
  }
} 