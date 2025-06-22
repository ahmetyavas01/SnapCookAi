import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import PurchaseService, { SubscriptionStatus } from '../services/purchaseService';

interface SubscriptionContextType {
  isPremium: boolean;
  subscriptionStatus: SubscriptionStatus | null;
  loading: boolean;
  refreshSubscriptionStatus: () => Promise<void>;
  deviceId: string | null;
  healthStatus: {
    supabaseConnected: boolean;
    deviceIdValid: boolean;
    subscriptionSynced: boolean;
    fallbackAvailable: boolean;
  } | null;
  performHealthCheck: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<{
    supabaseConnected: boolean;
    deviceIdValid: boolean;
    subscriptionSynced: boolean;
    fallbackAvailable: boolean;
  } | null>(null);

  useEffect(() => {
    initializeSubscription();
  }, []);

  const initializeSubscription = async () => {
    try {
      setLoading(true);
      
      const purchaseService = PurchaseService.getInstance();
      await purchaseService.initialize();
      
      await refreshSubscriptionStatus();
      await performHealthCheck();
      
    } catch (error) {
      console.error('Error initializing subscription:', error);
      // Set fallback values in case of initialization failure
      setIsPremium(false);
      setSubscriptionStatus({
        isActive: false,
        planType: 'free',
        expiresAt: null,
        deviceId: 'fallback'
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscriptionStatus = async () => {
    try {
      const purchaseService = PurchaseService.getInstance();
      const status = await purchaseService.getSubscriptionStatus();
      
      setSubscriptionStatus(status);
      setIsPremium(status.isActive && status.planType !== 'free');
      setDeviceId(status.deviceId);
      
      console.log('Subscription status updated:', {
        isPremium: status.isActive && status.planType !== 'free',
        planType: status.planType,
        deviceId: status.deviceId,
        expiresAt: status.expiresAt
      });
      
    } catch (error) {
      console.error('Error refreshing subscription status:', error);
      
      // Fallback to safe defaults
      setIsPremium(false);
      setSubscriptionStatus(prev => prev || {
        isActive: false,
        planType: 'free',
        expiresAt: null,
        deviceId: 'fallback'
      });
    }
  };

  const performHealthCheck = async () => {
    try {
      const purchaseService = PurchaseService.getInstance();
      const health = await purchaseService.performHealthCheck();
      
      setHealthStatus(health);
      
      // Log health status for monitoring
      console.log('Subscription system health check:', health);
      
      // If there are critical issues, you could trigger alerts or fallback mechanisms here
      if (!health.supabaseConnected && !health.fallbackAvailable) {
        console.warn('Critical: Both Supabase and fallback systems are unavailable');
        // You could implement additional fallback logic here
      }
      
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatus({
        supabaseConnected: false,
        deviceIdValid: false,
        subscriptionSynced: false,
        fallbackAvailable: false
      });
    }
  };

  const value: SubscriptionContextType = {
    isPremium,
    subscriptionStatus,
    loading,
    refreshSubscriptionStatus,
    deviceId,
    healthStatus,
    performHealthCheck
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}; 