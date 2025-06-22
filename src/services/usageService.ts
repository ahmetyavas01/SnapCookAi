import AsyncStorage from '@react-native-async-storage/async-storage';

const USAGE_KEY = '@usage_count';
const LAST_RESET_KEY = '@last_reset';

export enum SubscriptionTier {
  FREE = 'FREE',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

const TIER_LIMITS = {
  [SubscriptionTier.FREE]: 1,
  [SubscriptionTier.WEEKLY]: 3,
  [SubscriptionTier.MONTHLY]: 5,
};

class UsageService {
  private static instance: UsageService | null = null;
  private currentTier: SubscriptionTier = SubscriptionTier.FREE;
  private usageCount: number = 0;
  private lastReset: number = Date.now();

  private constructor() {}

  static getInstance(): UsageService {
    if (!UsageService.instance) {
      UsageService.instance = new UsageService();
    }
    return UsageService.instance;
  }

  async initialize(): Promise<void> {
    try {
      const [usageCount, lastReset] = await Promise.all([
        AsyncStorage.getItem(USAGE_KEY),
        AsyncStorage.getItem(LAST_RESET_KEY),
      ]);

      this.usageCount = usageCount ? parseInt(usageCount) : 0;
      this.lastReset = lastReset ? parseInt(lastReset) : Date.now();

      await this.checkAndResetDaily();
    } catch (error) {
      console.error('Error initializing usage service:', error);
    }
  }

  private async checkAndResetDaily(): Promise<void> {
    const now = Date.now();
    const hoursSinceReset = (now - this.lastReset) / (1000 * 60 * 60);

    if (hoursSinceReset >= 24) {
      this.usageCount = 0;
      this.lastReset = now;
      await this.saveState();
    }
  }

  private async saveState(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(USAGE_KEY, this.usageCount.toString()),
        AsyncStorage.setItem(LAST_RESET_KEY, this.lastReset.toString()),
      ]);
    } catch (error) {
      console.error('Error saving usage state:', error);
    }
  }

  async canUseService(): Promise<{ allowed: boolean; message?: string }> {
    await this.checkAndResetDaily();
    const limit = TIER_LIMITS[this.currentTier];
    
    if (this.usageCount >= limit) {
      const hoursUntilReset = 24 - ((Date.now() - this.lastReset) / (1000 * 60 * 60));
      return {
        allowed: false,
        message: `Daily limit reached. Please wait ${Math.ceil(hoursUntilReset)} hours or upgrade to premium for more credits.`
      };
    }
    
    return { allowed: true };
  }

  async incrementUsage(): Promise<void> {
    await this.checkAndResetDaily();
    this.usageCount++;
    await this.saveState();
  }

  async getUsageStats(): Promise<{ used: number; limit: number; resetsIn: number }> {
    await this.checkAndResetDaily();
    const hoursUntilReset = 24 - ((Date.now() - this.lastReset) / (1000 * 60 * 60));
    
    return {
      used: this.usageCount,
      limit: TIER_LIMITS[this.currentTier],
      resetsIn: Math.ceil(hoursUntilReset),
    };
  }

  async setSubscriptionTier(tier: SubscriptionTier): Promise<void> {
    this.currentTier = tier;
  }

  getCurrentTier(): SubscriptionTier {
    return this.currentTier;
  }
}

export default UsageService; 