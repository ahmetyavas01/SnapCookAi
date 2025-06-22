import * as SecureStore from 'expo-secure-store';

// API key identifiers
const KEYS = {
  GOOGLE_CLOUD: 'GOOGLE_CLOUD_API_KEY',
  OPENAI: 'OPENAI_API_KEY',
} as const;

export type ApiKeyType = keyof typeof KEYS;

class KeyManagementService {
  private static instance: KeyManagementService;

  private constructor() {}

  static getInstance(): KeyManagementService {
    if (!KeyManagementService.instance) {
      KeyManagementService.instance = new KeyManagementService();
    }
    return KeyManagementService.instance;
  }

  async setApiKey(type: ApiKeyType, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEYS[type], value);
    } catch (error) {
      console.error(`Error storing ${type} key:`, error);
      throw new Error(`Failed to store ${type} key`);
    }
  }

  async getApiKey(type: ApiKeyType): Promise<string | null> {
    try {
      const key = await SecureStore.getItemAsync(KEYS[type]);
      return key;
    } catch (error) {
      console.error(`Error retrieving ${type} key:`, error);
      return null;
    }
  }

  async deleteApiKey(type: ApiKeyType): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(KEYS[type]);
    } catch (error) {
      console.error(`Error deleting ${type} key:`, error);
      throw new Error(`Failed to delete ${type} key`);
    }
  }

  async hasApiKey(type: ApiKeyType): Promise<boolean> {
    const key = await this.getApiKey(type);
    return key !== null;
  }
}

export default KeyManagementService; 