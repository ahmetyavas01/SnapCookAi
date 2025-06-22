import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Dimensions,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../utils/colors';
import { useSubscription } from '../context/SubscriptionContext';
import PurchaseService, { SubscriptionPackage } from '../services/purchaseService';
import LottieView from 'lottie-react-native';
import UsageService from '../services/usageService';

const { width } = Dimensions.get('window');

// Currency symbols mapping
const CURRENCY_SYMBOLS = {
  'USD': '$',
  'EUR': '€',
  'TRY': '₺',
  'GBP': '£'
};

// Country flag emojis
const COUNTRY_FLAGS = {
  'US': '🇺🇸',
  'CA': '🇨🇦', 
  'TR': '🇹🇷',
  'DEFAULT': '🌍'
};

// Country options for manual selection
const COUNTRY_OPTIONS = [
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', currency: 'TRY' },
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'USD' },
  { code: 'DEFAULT', name: 'Europe (Other)', flag: '🌍', currency: 'EUR' }
];

const PRICING_PLANS = [
  {
    id: 'free',
    title: 'Free',
    isRecommended: false,
    features: [
      '1 recipe per day',
      'Manual ingredient entry only',
      'Ads included'
    ],
    icon: 'gift-outline' as const,
    color: '#6B7280',
    buttonText: 'Current Plan'
  },
  {
    id: 'weekly',
    title: 'Weekly',
    isRecommended: false,
    features: [
      'Up to 3 AI-generated recipes per day',
      '3 different recipe options per search',
      'Includes image recognition (Cloud Vision)',
      'No ads',
      'Save to favorites'
    ],
    icon: 'flash' as const,
    color: '#10B981',
    buttonText: 'Start Now'
  },
  {
    id: 'monthly',
    title: 'Monthly',
    isRecommended: true,
    features: [
      'Up to 5 AI recipes per day',
      '3 different recipe options per search',
      'No ads',
      'Access to recipe history',
      '"What should I eat tonight?" feature'
    ],
    icon: 'star' as const,
    color: '#3B82F6',
    buttonText: 'Start Now'
  }
];

export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const { isPremium, refreshSubscriptionStatus } = useSubscription();
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [countryInfo, setCountryInfo] = useState<{
    country: string;
    currency: string;
    pricing: any;
    locale: string;
    region: string;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const purchaseService = PurchaseService.getInstance();
      
      // Get both packages and country pricing info
      const [availablePackages, countryPricing] = await Promise.all([
        purchaseService.getOfferings(),
        Promise.resolve(purchaseService.getCountryPricing())
      ]);
      
      setPackages(availablePackages);
      setCountryInfo(countryPricing);
      
      console.log('Loaded pricing for country:', countryPricing);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (planId: string) => {
    if (planId === 'free') return;
    
    setPurchasing(true);
    setSelectedPlan(planId);
    
    try {
      const purchaseService = PurchaseService.getInstance();
      // Map plan ID to package identifier
      const packageId = planId === 'weekly' ? 'weekly_premium' : 'monthly_premium';
      const success = await purchaseService.purchasePackage(packageId);
      
      if (success) {
        await refreshSubscriptionStatus();
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error during purchase:', error);
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const purchaseService = PurchaseService.getInstance();
      const success = await purchaseService.restorePurchases();
      
      if (success) {
        await refreshSubscriptionStatus();
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error restoring purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = () => {
    Alert.alert(
      'Select Your Region',
      'Choose your region for accurate pricing:',
      [
        ...COUNTRY_OPTIONS.map(country => ({
          text: `${country.flag} ${country.name} (${country.currency})`,
          onPress: () => changeCountry(country.code as 'TR' | 'US' | 'CA' | 'DEFAULT')
        })),
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const changeCountry = async (countryCode: 'TR' | 'US' | 'CA' | 'DEFAULT') => {
    setLoading(true);
    try {
      const purchaseService = PurchaseService.getInstance();
      await purchaseService.setCountryOverride(countryCode);
      
      // Reload pricing data
      await loadData();
    } catch (error) {
      console.error('Error changing country:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriceForPlan = (planId: string) => {
    if (!countryInfo || planId === 'free') return { price: '$0', period: '' };
    
    const currencySymbol = CURRENCY_SYMBOLS[countryInfo.currency as keyof typeof CURRENCY_SYMBOLS] || countryInfo.currency;
    
    if (planId === 'weekly') {
      return {
        price: `${currencySymbol}${countryInfo.pricing.weekly.price}`,
        period: '/week'
      };
    } else if (planId === 'monthly') {
      return {
        price: `${currencySymbol}${countryInfo.pricing.monthly.price}`,
        period: '/month'
      };
    }
    
    return { price: '$0', period: '' };
  };

  const getCountryFlag = () => {
    if (!countryInfo) return '🌍';
    
    if (countryInfo.country === 'US' || countryInfo.country === 'CA') {
      return COUNTRY_FLAGS[countryInfo.country as keyof typeof COUNTRY_FLAGS];
    } else if (countryInfo.country === 'TR') {
      return COUNTRY_FLAGS['TR'];
    } else {
      return COUNTRY_FLAGS['DEFAULT'];
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../../assets/cooking.json')}
          autoPlay
          loop
          style={styles.loadingAnimation}
        />
        <Text style={styles.loadingText}>Loading pricing...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            {/* App icon instead of Ionicons */}
            <Image
              source={require('../../assets/icon.png')}
              style={styles.appIcon}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Upgrade to Premium</Text>
          <Text style={styles.subtitle}>
            Get smarter meals, every day. Unlock AI-powered recipes with rich nutrition and image recognition.
          </Text>
          
          {/* Country/Currency Info */}
          {countryInfo && (
            <View style={styles.countryInfo}>
              <Text style={styles.countryFlag}>{getCountryFlag()}</Text>
              <Text style={styles.countryText}>
                Pricing in {countryInfo.currency}
                {countryInfo.country !== 'DEFAULT' && ` • ${countryInfo.country}`}
              </Text>
            </View>
          )}
        </View>

        {/* Pricing Plans */}
        <View style={styles.plansContainer}>
          {PRICING_PLANS.map((plan) => {
            const priceInfo = getPriceForPlan(plan.id);
            
            return (
              <View key={plan.id} style={[
                styles.planCard,
                plan.isRecommended && styles.recommendedCard
              ]}>
                {plan.isRecommended && (
                  <View style={styles.recommendedBadge}>
                    <Ionicons name="star" size={16} color="#FFFFFF" />
                    <Text style={styles.recommendedText}>MOST POPULAR</Text>
                  </View>
                )}
                
                <View style={styles.planHeader}>
                  <View style={[styles.planIcon, { backgroundColor: `${plan.color}15` }]}>
                    <Ionicons name={plan.icon} size={20} color={plan.color} />
                  </View>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.planPrice, { color: plan.color }]}>
                      {priceInfo.price}
                    </Text>
                    {priceInfo.period && (
                      <Text style={styles.planPeriod}>{priceInfo.period}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.featuresContainer}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <View style={[styles.featureCheck, { backgroundColor: `${plan.color}20` }]}>
                        <Ionicons name="checkmark" size={12} color={plan.color} />
                      </View>
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.planButton,
                    plan.id === 'free' ? styles.freeButton : { backgroundColor: plan.color },
                    plan.isRecommended && styles.recommendedButton
                  ]}
                  onPress={() => handlePurchase(plan.id)}
                  disabled={purchasing || plan.id === 'free'}
                >
                  {purchasing && selectedPlan === plan.id ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={[
                      styles.planButtonText,
                      plan.id === 'free' && styles.freeButtonText
                    ]}>
                      {plan.buttonText}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Additional Info */}
        <View style={styles.additionalInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={18} color="#10B981" />
            <Text style={styles.infoText}>Cancel anytime, no commitment</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="refresh" size={18} color="#10B981" />
            <Text style={styles.infoText}>Instant access to all features</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="card" size={18} color="#10B981" />
            <Text style={styles.infoText}>Secure payment via {Platform.OS === 'ios' ? 'App Store' : 'Google Play'}</Text>
          </View>
        </View>

        {/* Restore Purchases */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={loading}
        >
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.termsText}>
          Subscriptions auto-renew unless cancelled 24 hours before the period ends. 
          Manage in {Platform.OS === 'ios' ? 'App Store' : 'Google Play'} settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  loadingAnimation: {
    width: 120,
    height: 120,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 16,
    marginTop: 16,
  },
  // Remove closeButton, add backButton
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  appIcon: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  countryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  countryFlag: {
    fontSize: 18,
  },
  countryText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '600',
  },
  countryChangeButton: {
    padding: 6,
  },
  detectionInfo: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 6,
  },
  plansContainer: {
    paddingHorizontal: 12,
    gap: 10,
    marginBottom: 28,
  },
  planCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 2,
  },
  recommendedCard: {
    borderColor: '#3B82F6',
    transform: [{ scale: 1.01 }],
    shadowColor: '#3B82F6',
    shadowOpacity: 0.22,
    backgroundColor: '#1E293B',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -7,
    left: 14,
    right: 14,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  recommendedText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  planIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 7,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '700',
  },
  planPeriod: {
    fontSize: 13,
    color: '#94A3B8',
    marginLeft: 3,
  },
  featuresContainer: {
    marginBottom: 14,
    gap: 7,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  featureCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  featureText: {
    fontSize: 12,
    color: '#CBD5E1',
    flex: 1,
    lineHeight: 16,
  },
  planButton: {
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  freeButton: {
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  recommendedButton: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
  },
  planButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  freeButtonText: {
    color: '#9CA3AF',
  },
  additionalInfo: {
    paddingHorizontal: 14,
    marginBottom: 20,
    gap: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    color: '#94A3B8',
    fontSize: 12,
    flex: 1,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 14,
  },
  restoreButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  termsText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginHorizontal: 24,
    marginBottom: 24,
    lineHeight: 16,
  },
}); 