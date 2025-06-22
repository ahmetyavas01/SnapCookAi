import Purchases, { 
  PurchasesOffering, 
  PurchasesPackage, 
  CustomerInfo,
  PurchasesEntitlementInfo 
} from 'react-native-purchases';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

export interface SubscriptionPackage {
  identifier: string;
  title: string;
  price: string;
  period: string;
  features: string[];
  localizedPrice?: string;
  countryCode?: string;
  currencyCode?: string;
  originalPrice?: number;
}

export interface SubscriptionStatus {
  isActive: boolean;
  planType: 'free' | 'weekly' | 'monthly';
  expiresAt: Date | null;
  deviceId: string;
  userId?: string;
  countryCode?: string;
  originalTransactionId?: string;
}

export interface DeviceSubscription {
  id: string;
  device_id: string;
  user_id?: string;
  plan_type: 'free' | 'weekly' | 'monthly';
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  purchase_token?: string;
  original_transaction_id?: string;
  country_code?: string;
  currency_code?: string;
  local_price?: string;
}

// Country-specific pricing configuration
interface CountryPricing {
  [key: string]: {
    weekly: { price: string; currency: string };
    monthly: { price: string; currency: string };
  };
}

const COUNTRY_PRICING: CountryPricing = {
  // Turkey - Turkish Lira
  'TR': {
    weekly: { price: '19.99', currency: 'TRY' },
    monthly: { price: '49.99', currency: 'TRY' }
  },
  // United States - US Dollar
  'US': {
    weekly: { price: '1.99', currency: 'USD' },
    monthly: { price: '4.99', currency: 'USD' }
  },
  // Canada - US Dollar
  'CA': {
    weekly: { price: '1.99', currency: 'USD' },
    monthly: { price: '4.99', currency: 'USD' }
  },
  // Default fallback - Euro for all other countries
  'DEFAULT': {
    weekly: { price: '1.99', currency: 'EUR' },
    monthly: { price: '4.99', currency: 'EUR' }
  }
};

class PurchaseService {
  private static instance: PurchaseService;
  private supabase: SupabaseClient;
  private deviceId: string | null = null;
  private isInitialized = false;
  private currentCountry: string = 'US';
  private currentCurrency: string = 'USD';

  private constructor() {
    // Initialize Supabase client
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  static getInstance(): PurchaseService {
    if (!PurchaseService.instance) {
      PurchaseService.instance = new PurchaseService();
    }
    return PurchaseService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Get device and location info
      this.deviceId = await this.getDeviceId();
      await this.detectCountryAndCurrency();

      // Initialize RevenueCat
      const revenueCatApiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
      if (!revenueCatApiKey) {
        throw new Error('RevenueCat API key not found');
      }

      await Purchases.configure({ apiKey: revenueCatApiKey });
      
      // Set user attributes for better analytics
      await Purchases.setAttributes({
        'device_id': this.deviceId,
        'country': this.currentCountry,
        'currency': this.currentCurrency
      });

      // Sync subscription status with Supabase
      await this.syncSubscriptionStatus();
      
      this.isInitialized = true;
      console.log('PurchaseService initialized:', {
        deviceId: this.deviceId,
        country: this.currentCountry,
        currency: this.currentCurrency
      });
    } catch (error) {
      console.error('Failed to initialize PurchaseService:', error);
      // Fallback to local storage in case of initialization issues
      this.isInitialized = true;
    }
  }

  private async detectCountryAndCurrency(): Promise<void> {
    try {
      // Check if user has manually set a country override
      const countryOverride = await this.checkCountryOverride();
      
      if (countryOverride && ['TR', 'US', 'CA', 'DEFAULT'].includes(countryOverride)) {
        this.currentCountry = countryOverride;
        console.log('Using country override:', countryOverride);
      } else {
        // Get locale information for auto-detection
        const locale = Localization.locale; // e.g., "en-US", "tr-TR", "tr-US"
        const region = Localization.region; // e.g., "US", "TR", "CA"
        
        // Extract language from locale (first 2 characters)
        const language = locale.split('-')[0].toLowerCase();
        
        // Determine country based on language preference first, then region
        let detectedCountry: string;
        
        if (language === 'tr') {
          // Turkish language users get Turkish pricing regardless of region
          detectedCountry = 'TR';
          console.log('Turkish language detected, using Turkish pricing');
        } else if (region === 'TR') {
          // Users in Turkey get Turkish pricing
          detectedCountry = 'TR';
        } else if (region === 'US' || region === 'CA') {
          // US and Canada users get USD pricing
          detectedCountry = region;
        } else {
          // All other regions get Euro pricing
          detectedCountry = 'DEFAULT';
        }
        
        this.currentCountry = detectedCountry;
        
        console.log('Auto-detected location:', {
          locale,
          region,
          language,
          country: this.currentCountry
        });
      }
      
      // Get currency based on country rules
      let countryConfig;
      if (this.currentCountry === 'TR') {
        // Turkey uses Turkish Lira
        countryConfig = COUNTRY_PRICING['TR'];
      } else if (this.currentCountry === 'US' || this.currentCountry === 'CA') {
        // US and Canada use US Dollar
        countryConfig = COUNTRY_PRICING['US']; // Both use same pricing
      } else {
        // All other countries use Euro
        countryConfig = COUNTRY_PRICING['DEFAULT'];
      }
      
      this.currentCurrency = countryConfig.weekly.currency;
      
      console.log('Final pricing configuration:', {
        country: this.currentCountry,
        currency: this.currentCurrency,
        pricing: countryConfig
      });
    } catch (error) {
      console.error('Error detecting country:', error);
      // Fallback to Euro (most common)
      this.currentCountry = 'DEFAULT';
      this.currentCurrency = 'EUR';
    }
  }

  private async getDeviceId(): Promise<string> {
    try {
      // Try to get stored device ID first
      let deviceId = await AsyncStorage.getItem('device_id');
      
      if (!deviceId) {
        // Generate device ID using device info
        const deviceName = Device.deviceName || 'unknown';
        const osName = Device.osName || 'unknown';
        const osVersion = Device.osVersion || 'unknown';
        const timestamp = Date.now();
        
        deviceId = `${deviceName}_${osName}_${osVersion}_${timestamp}`.replace(/[^a-zA-Z0-9_]/g, '_');
        
        // Store for future use
        await AsyncStorage.setItem('device_id', deviceId);
      }
      
      return deviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      // Fallback device ID
      return `fallback_${Date.now()}`;
    }
  }

  async getOfferings(): Promise<SubscriptionPackage[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Get offerings from RevenueCat
      const offerings = await Purchases.getOfferings();
      const packages: SubscriptionPackage[] = [];

      if (offerings.current) {
        // Process available packages
        offerings.current.availablePackages.forEach((pkg: PurchasesPackage) => {
          const packageId = pkg.identifier;
          const planType = this.getPlanTypeFromPackage(pkg);
          
          if (planType) {
            packages.push({
              identifier: packageId,
              title: this.getLocalizedTitle(planType),
              price: pkg.product.priceString,
              period: this.getPeriodFromPackage(pkg),
              features: this.getFeaturesForPlan(planType),
              localizedPrice: pkg.product.priceString,
              countryCode: this.currentCountry,
              currencyCode: pkg.product.currencyCode,
              originalPrice: pkg.product.price
            });
          }
        });
      }

      // If no packages from RevenueCat, return fallback packages
      if (packages.length === 0) {
        return this.getFallbackPackages();
      }

      return packages;
    } catch (error) {
      console.error('Error getting offerings:', error);
      return this.getFallbackPackages();
    }
  }

  private getFallbackPackages(): SubscriptionPackage[] {
    // Get correct pricing based on country rules
    let countryConfig;
    if (this.currentCountry === 'TR') {
      countryConfig = COUNTRY_PRICING['TR'];
    } else if (this.currentCountry === 'US' || this.currentCountry === 'CA') {
      countryConfig = COUNTRY_PRICING['US'];
    } else {
      countryConfig = COUNTRY_PRICING['DEFAULT'];
    }
    
    return [
      {
        identifier: 'weekly_premium',
        title: 'Weekly Premium',
        price: `${countryConfig.weekly.price} ${countryConfig.weekly.currency}`,
        period: 'week',
        features: [
          'Up to 3 AI-generated recipes per day',
          '3 different recipe options per search',
          'Includes image recognition (Cloud Vision)',
          'No ads',
          'Save to favorites'
        ],
        countryCode: this.currentCountry,
        currencyCode: countryConfig.weekly.currency
      },
      {
        identifier: 'monthly_premium',
        title: 'Monthly Premium',
        price: `${countryConfig.monthly.price} ${countryConfig.monthly.currency}`,
        period: 'month',
        features: [
          'Up to 5 AI recipes per day',
          '3 different recipe options per search',
          'No ads',
          'Access to recipe history',
          '"What should I eat tonight?" feature'
        ],
        countryCode: this.currentCountry,
        currencyCode: countryConfig.monthly.currency
      }
    ];
  }

  private getPlanTypeFromPackage(pkg: PurchasesPackage): 'weekly' | 'monthly' | null {
    const identifier = pkg.identifier.toLowerCase();
    if (identifier.includes('weekly')) return 'weekly';
    if (identifier.includes('monthly')) return 'monthly';
    return null;
  }

  private getPeriodFromPackage(pkg: PurchasesPackage): string {
    const identifier = pkg.identifier.toLowerCase();
    if (identifier.includes('weekly')) return 'week';
    if (identifier.includes('monthly')) return 'month';
    return 'month';
  }

  private getLocalizedTitle(planType: 'weekly' | 'monthly'): string {
    // You can add localization here based on current locale
    const titles = {
      weekly: 'Weekly Premium',
      monthly: 'Monthly Premium'
    };
    return titles[planType];
  }

  private getFeaturesForPlan(planType: 'weekly' | 'monthly'): string[] {
    if (planType === 'weekly') {
      return [
        'Up to 3 AI-generated recipes per day',
        '3 different recipe options per search',
        'Includes image recognition (Cloud Vision)',
        'No ads',
        'Save to favorites'
      ];
    } else {
      return [
        'Up to 5 AI recipes per day',
        '3 different recipe options per search',
        'No ads',
        'Access to recipe history',
        '"What should I eat tonight?" feature'
      ];
    }
  }

  async purchasePackage(packageId: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Get the package from offerings
      const offerings = await Purchases.getOfferings();
      const targetPackage = offerings.current?.availablePackages.find(
        pkg => pkg.identifier === packageId
      );

      if (!targetPackage) {
        console.error('Package not found:', packageId);
        return false;
      }

      // Make the purchase
      const { customerInfo } = await Purchases.purchasePackage(targetPackage);
      
      // Check if purchase was successful
      const isActive = this.checkActiveEntitlements(customerInfo);
      
      if (isActive) {
        // Sync with Supabase
        await this.syncPurchaseWithSupabase(customerInfo, targetPackage);
        console.log('Purchase successful:', packageId);
    return true;
      }

      return false;
    } catch (error) {
      console.error('Error purchasing package:', error);
      return false;
    }
  }

  async restorePurchases(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const { customerInfo } = await Purchases.restorePurchases();
      const isActive = this.checkActiveEntitlements(customerInfo);
      
      if (isActive) {
        // Sync with Supabase
        await this.syncCustomerInfoWithSupabase(customerInfo);
        console.log('Purchases restored successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      return false;
    }
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Get customer info from RevenueCat
      const customerInfo = await Purchases.getCustomerInfo();
      const isActive = this.checkActiveEntitlements(customerInfo);
      
      if (isActive) {
        const activeEntitlement = this.getActiveEntitlement(customerInfo);
        const planType = this.getPlanTypeFromEntitlement(activeEntitlement);
        
        return {
          isActive: true,
          planType,
          expiresAt: activeEntitlement?.expirationDate ? new Date(activeEntitlement.expirationDate) : null,
          deviceId: this.deviceId!,
          countryCode: this.currentCountry,
          originalTransactionId: activeEntitlement?.productIdentifier
        };
      }

      // Check Supabase as fallback
      return await this.getSupabaseSubscriptionStatus();
      
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return this.getFallbackSubscriptionStatus();
    }
  }

  private checkActiveEntitlements(customerInfo: CustomerInfo): boolean {
    return Object.keys(customerInfo.entitlements.active).length > 0;
  }

  private getActiveEntitlement(customerInfo: CustomerInfo): PurchasesEntitlementInfo | null {
    const activeEntitlements = customerInfo.entitlements.active;
    const entitlementKeys = Object.keys(activeEntitlements);
    
    if (entitlementKeys.length > 0) {
      return activeEntitlements[entitlementKeys[0]];
    }
    
    return null;
  }

  private getPlanTypeFromEntitlement(entitlement: PurchasesEntitlementInfo | null): 'weekly' | 'monthly' {
    if (!entitlement) return 'monthly';
    
    const identifier = entitlement.identifier.toLowerCase();
    if (identifier.includes('weekly')) return 'weekly';
    return 'monthly';
  }

  private async syncPurchaseWithSupabase(customerInfo: CustomerInfo, purchasedPackage: PurchasesPackage): Promise<void> {
    try {
      const activeEntitlement = this.getActiveEntitlement(customerInfo);
      if (!activeEntitlement) return;

      const planType = this.getPlanTypeFromEntitlement(activeEntitlement);
      const expiresAt = activeEntitlement.expirationDate ? new Date(activeEntitlement.expirationDate) : null;

      // Deactivate existing subscriptions
      await this.deactivateAllSubscriptions();

      // Create new subscription record
      const subscriptionData = {
        device_id: this.deviceId,
        plan_type: planType,
        is_active: true,
        expires_at: expiresAt?.toISOString(),
        purchase_token: activeEntitlement.productIdentifier,
        original_transaction_id: activeEntitlement.productIdentifier,
        country_code: this.currentCountry,
        currency_code: this.currentCurrency,
        local_price: purchasedPackage.product.priceString,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await this.supabase
        .from('device_subscriptions')
        .insert(subscriptionData);

      if (error) {
        console.error('Error syncing purchase with Supabase:', error);
      }
    } catch (error) {
      console.error('Error in syncPurchaseWithSupabase:', error);
    }
  }

  private async syncCustomerInfoWithSupabase(customerInfo: CustomerInfo): Promise<void> {
    try {
      const activeEntitlement = this.getActiveEntitlement(customerInfo);
      if (!activeEntitlement) return;

      const mockPackage = {
        identifier: activeEntitlement.identifier,
        product: {
          priceString: 'restored',
          currencyCode: this.currentCurrency,
          price: 0
        }
      } as PurchasesPackage;
      
      await this.syncPurchaseWithSupabase(customerInfo, mockPackage);
    } catch (error) {
      console.error('Error syncing customer info with Supabase:', error);
    }
  }

  private async getSupabaseSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const { data, error } = await this.supabase
        .from('device_subscriptions')
        .select('*')
        .eq('device_id', this.deviceId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return this.getFallbackSubscriptionStatus();
      }

      const subscription = data as DeviceSubscription;
      const isExpired = subscription.expires_at ? new Date(subscription.expires_at) < new Date() : false;
      
      if (isExpired) {
        await this.deactivateSubscription(subscription.id);
        return this.getFallbackSubscriptionStatus();
      }

      return {
        isActive: subscription.is_active,
        planType: subscription.plan_type,
        expiresAt: subscription.expires_at ? new Date(subscription.expires_at) : null,
        deviceId: this.deviceId!,
        countryCode: subscription.country_code,
        originalTransactionId: subscription.original_transaction_id
      };
    } catch (error) {
      console.error('Error getting Supabase subscription status:', error);
      return this.getFallbackSubscriptionStatus();
    }
  }

  private getFallbackSubscriptionStatus(): SubscriptionStatus {
    return {
      isActive: false,
      planType: 'free',
      expiresAt: null,
      deviceId: this.deviceId!,
      countryCode: this.currentCountry
    };
  }

  private async deactivateAllSubscriptions(): Promise<void> {
    try {
      await this.supabase
        .from('device_subscriptions')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('device_id', this.deviceId)
        .eq('is_active', true);
    } catch (error) {
      console.error('Error deactivating subscriptions:', error);
    }
  }

  private async deactivateSubscription(subscriptionId: string): Promise<void> {
    try {
      await this.supabase
        .from('device_subscriptions')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', subscriptionId);
    } catch (error) {
      console.error('Error deactivating subscription:', error);
    }
  }

  private async syncSubscriptionStatus(): Promise<void> {
    try {
      const status = await this.getSubscriptionStatus();
      await AsyncStorage.setItem('subscription_status', JSON.stringify(status));
    } catch (error) {
      console.error('Error syncing subscription status:', error);
    }
  }

  // Health check method
  async performHealthCheck(): Promise<{
    revenueCatConnected: boolean;
    supabaseConnected: boolean;
    deviceIdValid: boolean;
    subscriptionSynced: boolean;
    fallbackAvailable: boolean;
  }> {
    try {
      // Test RevenueCat connection
      let revenueCatConnected = false;
      try {
        await Purchases.getCustomerInfo();
        revenueCatConnected = true;
      } catch (error) {
        revenueCatConnected = false;
      }

      // Test Supabase connection
      const { error: connectionError } = await this.supabase
        .from('device_subscriptions')
        .select('count')
        .limit(1);

      const supabaseConnected = !connectionError;

      // Check device ID
      const deviceIdValid = !!this.deviceId && this.deviceId.length > 0;

      // Test subscription sync
      let subscriptionSynced = false;
      try {
        await this.getSubscriptionStatus();
        subscriptionSynced = true;
      } catch (error) {
        subscriptionSynced = false;
      }

      // Check fallback availability
      let fallbackAvailable = false;
      try {
        const fallbackData = await AsyncStorage.getItem('subscription_status');
        fallbackAvailable = !!fallbackData;
      } catch (error) {
        fallbackAvailable = false;
      }

      return {
        revenueCatConnected,
        supabaseConnected,
        deviceIdValid,
        subscriptionSynced,
        fallbackAvailable
      };

    } catch (error) {
      console.error('Health check failed:', error);
      return {
        revenueCatConnected: false,
        supabaseConnected: false,
        deviceIdValid: false,
        subscriptionSynced: false,
        fallbackAvailable: false
      };
    }
  }

  // Get country-specific pricing info
  getCountryPricing(): { country: string; currency: string; pricing: any; locale: string; region: string } {
    // Get correct pricing based on country rules
    let countryConfig;
    if (this.currentCountry === 'TR') {
      countryConfig = COUNTRY_PRICING['TR'];
    } else if (this.currentCountry === 'US' || this.currentCountry === 'CA') {
      countryConfig = COUNTRY_PRICING['US'];
    } else {
      countryConfig = COUNTRY_PRICING['DEFAULT'];
    }
    
    return {
      country: this.currentCountry,
      currency: this.currentCurrency,
      pricing: countryConfig,
      locale: Localization.locale,
      region: Localization.region || 'UNKNOWN'
    };
  }

  // Manual country override for users who want to change pricing region
  async setCountryOverride(countryCode: 'TR' | 'US' | 'CA' | 'DEFAULT'): Promise<void> {
    try {
      this.currentCountry = countryCode;
      
      // Get currency based on country rules
      let countryConfig;
      if (this.currentCountry === 'TR') {
        countryConfig = COUNTRY_PRICING['TR'];
      } else if (this.currentCountry === 'US' || this.currentCountry === 'CA') {
        countryConfig = COUNTRY_PRICING['US'];
      } else {
        countryConfig = COUNTRY_PRICING['DEFAULT'];
      }
      
      this.currentCurrency = countryConfig.weekly.currency;
      
      // Store override preference
      await AsyncStorage.setItem('country_override', countryCode);
      
      // Update RevenueCat attributes
      if (this.isInitialized) {
        await Purchases.setAttributes({
          'device_id': this.deviceId,
          'country': this.currentCountry,
          'currency': this.currentCurrency,
          'country_override': 'true'
        });
      }
      
      console.log('Country override set:', {
        country: this.currentCountry,
        currency: this.currentCurrency,
        pricing: countryConfig
      });
    } catch (error) {
      console.error('Error setting country override:', error);
    }
  }

  // Check if user has a stored country override
  private async checkCountryOverride(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('country_override');
    } catch (error) {
      console.error('Error checking country override:', error);
      return null;
    }
  }
}

export default PurchaseService; 