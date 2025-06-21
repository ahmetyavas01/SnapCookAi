import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useReducer, useState } from 'react';
import { Recipe } from '../services/recipeService';
import type { DetectedIngredient } from '../services/visionService';

export interface Country {
  id: string;
  name: string;
  flag: string;
}

export interface MealType {
  id: string;
  name: string;
  icon: string;
  emoji: string;
}

export const COUNTRIES: Country[] = [
  { id: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { id: 'it', name: 'Italian', flag: '🇮🇹' },
  { id: 'jp', name: 'Japanese', flag: '🇯🇵' },
  { id: 'mx', name: 'Mexican', flag: '🇲🇽' },
  { id: 'in', name: 'Indian', flag: '🇮🇳' },
  { id: 'fr', name: 'French', flag: '🇫🇷' },
  { id: 'gr', name: 'Greek', flag: '🇬🇷' },
  { id: 'th', name: 'Thai', flag: '🇹🇭' },
];

export const MEAL_TYPES: MealType[] = [
  { id: 'breakfast', name: 'Breakfast', icon: '🍳', emoji: '☀️' },
  { id: 'lunch', name: 'Lunch', icon: '🍜', emoji: '🌤️' },
  { id: 'dinner', name: 'Dinner', icon: '🍽️', emoji: '🌙' },
  { id: 'dessert', name: 'Dessert', icon: '🍰', emoji: '🍫' },
  { id: 'snack', name: 'Snack', icon: '🥨', emoji: '🎯' },
];

export const ACTION_TYPES = {
  SET_INGREDIENTS: 'SET_INGREDIENTS',
  SET_DETECTED_INGREDIENTS: 'SET_DETECTED_INGREDIENTS',
  SET_CUISINE: 'SET_CUISINE',
  SET_SELECTED_RECIPE: 'SET_SELECTED_RECIPE',
  RESET_STATE: 'RESET_STATE',
} as const;

interface AppState {
  ingredients: string[];
  detectedIngredients: DetectedIngredient[];
  selectedCuisine: string;
  selectedRecipe: Recipe | null;
}

type AppAction =
  | { type: typeof ACTION_TYPES.SET_INGREDIENTS; payload: string[] }
  | { type: typeof ACTION_TYPES.SET_DETECTED_INGREDIENTS; payload: DetectedIngredient[] }
  | { type: typeof ACTION_TYPES.SET_CUISINE; payload: string }
  | { type: typeof ACTION_TYPES.SET_SELECTED_RECIPE; payload: Recipe | null }
  | { type: typeof ACTION_TYPES.RESET_STATE };

const initialState: AppState = {
  ingredients: [],
  detectedIngredients: [],
  selectedCuisine: 'Italian',
  selectedRecipe: null,
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case ACTION_TYPES.SET_INGREDIENTS:
      return {
        ...state,
        ingredients: action.payload,
      };
    case ACTION_TYPES.SET_DETECTED_INGREDIENTS:
      return {
        ...state,
        detectedIngredients: action.payload,
      };
    case ACTION_TYPES.SET_CUISINE:
      return {
        ...state,
        selectedCuisine: action.payload,
      };
    case ACTION_TYPES.SET_SELECTED_RECIPE:
      return {
        ...state,
        selectedRecipe: action.payload,
      };
    case ACTION_TYPES.RESET_STATE:
      return initialState;
    default:
      return state;
  }
}

type SubscriptionTier = 'free' | 'premium';

interface UsageQuota {
  recipeSearches: number;
  photoAnalysis: number;
  savedRecipes: number;
}

interface SubscriptionLimits {
  free: {
    dailyRecipeSearchLimit: number;
    dailyPhotoAnalysisLimit: number;
    savedRecipesLimit: number;
  };
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  subscriptionTier: SubscriptionTier;
  usageQuota: UsageQuota;
  updateUsageQuota: (type: keyof UsageQuota) => void;
  resetDailyQuota: () => void;
  upgradeSubscription: () => void;
  subscriptionLimits: SubscriptionLimits;
}

const DEFAULT_LIMITS: SubscriptionLimits = {
  free: {
    dailyRecipeSearchLimit: 3,
    dailyPhotoAnalysisLimit: 1,
    savedRecipesLimit: 5,
  }
};

const DEFAULT_QUOTA: UsageQuota = {
  recipeSearches: 0,
  photoAnalysis: 0,
  savedRecipes: 0,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  const [usageQuota, setUsageQuota] = useState<UsageQuota>(DEFAULT_QUOTA);
  const [subscriptionLimits] = useState<SubscriptionLimits>(DEFAULT_LIMITS);

  useEffect(() => {
    loadQuota();
    checkAndResetDailyQuota();
  }, []);

  const loadQuota = async () => {
    try {
      const storedQuota = await AsyncStorage.getItem('usageQuota');
      if (storedQuota) {
        setUsageQuota(JSON.parse(storedQuota));
      }
    } catch (error) {
      console.error('Error loading quota:', error);
    }
  };

  const updateUsageQuota = async (type: keyof UsageQuota) => {
    try {
      const newQuota = { ...usageQuota, [type]: usageQuota[type] + 1 };
      setUsageQuota(newQuota);
      await AsyncStorage.setItem('usageQuota', JSON.stringify(newQuota));
    } catch (error) {
      console.error('Error updating quota:', error);
    }
  };

  const resetDailyQuota = async () => {
    try {
      const newQuota = { ...DEFAULT_QUOTA, savedRecipes: usageQuota.savedRecipes };
      setUsageQuota(newQuota);
      await AsyncStorage.setItem('usageQuota', JSON.stringify(newQuota));
      await AsyncStorage.setItem('lastResetDate', new Date().toISOString());
    } catch (error) {
      console.error('Error resetting quota:', error);
    }
  };

  const checkAndResetDailyQuota = async () => {
    try {
      const lastResetDate = await AsyncStorage.getItem('lastResetDate');
      if (lastResetDate) {
        const lastReset = new Date(lastResetDate);
        const now = new Date();
        if (lastReset.getDate() !== now.getDate()) {
          await resetDailyQuota();
        }
      } else {
        await resetDailyQuota();
      }
    } catch (error) {
      console.error('Error checking reset date:', error);
    }
  };

  const upgradeSubscription = () => {
    setSubscriptionTier('premium');
  };

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
} 