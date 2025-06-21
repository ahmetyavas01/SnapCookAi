import React, { createContext, useContext, useEffect, useState } from 'react';
import { purchaseService } from '../services/purchaseService';

type SubscriptionContextType = {
  isPremium: boolean;
  setIsPremium: (value: boolean) => void;
  checkSubscriptionStatus: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPremium: false,
  setIsPremium: () => {},
  checkSubscriptionStatus: async () => {},
});

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    initializeSubscription();
  }, []);

  const initializeSubscription = async () => {
    try {
      await purchaseService.initialize();
      await checkSubscriptionStatus();
    } catch (error) {
      console.error('Failed to initialize subscription:', error);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const hasPremium = await purchaseService.checkSubscriptionStatus();
      setIsPremium(hasPremium);
    } catch (error) {
      console.error('Failed to check subscription status:', error);
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        setIsPremium,
        checkSubscriptionStatus,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}; 