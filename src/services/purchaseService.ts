import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREMIUM_STATUS_KEY = '@premium_status';

export type SubscriptionPackage = {
  identifier: string;
  title: string;
  description: string;
  price: string;
  period: string;
};

const MOCK_PACKAGES: SubscriptionPackage[] = [
  {
    identifier: 'monthly',
    title: 'Monthly Premium',
    description: 'Full access to all premium features',
    price: '$4.99',
    period: 'month',
  },
  {
    identifier: 'yearly',
    title: 'Yearly Premium',
    description: 'Full access to all premium features',
    price: '$39.99',
    period: 'year',
  },
];

class PurchaseService {
  private static instance: PurchaseService;

  private constructor() {}

  static getInstance(): PurchaseService {
    if (!PurchaseService.instance) {
      PurchaseService.instance = new PurchaseService();
    }
    return PurchaseService.instance;
  }

  async initialize(): Promise<void> {
    // Mock initialization
    console.log('Mock purchase service initialized');
  }

  async getOfferings(): Promise<SubscriptionPackage[]> {
    return MOCK_PACKAGES;
  }

  async purchasePackage(packageIdentifier: string): Promise<boolean> {
    // Simulate successful purchase
    await AsyncStorage.setItem(PREMIUM_STATUS_KEY, 'true');
    return true;
  }

  async restorePurchases(): Promise<boolean> {
    // Check if we have a stored premium status
    const status = await AsyncStorage.getItem(PREMIUM_STATUS_KEY);
    return status === 'true';
  }

  async checkSubscriptionStatus(): Promise<boolean> {
    // Check stored premium status
    const status = await AsyncStorage.getItem(PREMIUM_STATUS_KEY);
    return status === 'true';
  }
}

export const purchaseService = PurchaseService.getInstance(); 