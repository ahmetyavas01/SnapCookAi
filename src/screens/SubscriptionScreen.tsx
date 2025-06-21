import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { COLORS } from '../utils/colors';
import { purchaseService, SubscriptionPackage } from '../services/purchaseService';
import { useSubscription } from '../context/SubscriptionContext';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type SubscriptionScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Subscription'>;
};

const features = [
  {
    id: 1,
    title: 'Unlimited recipe generation',
    icon: 'infinite-outline',
    gradient: ['#667eea', '#764ba2'] as const,
  },
  {
    id: 2,
    title: 'Premium recipes & suggestions',
    icon: 'star-outline',
    gradient: ['#f093fb', '#f5576c'] as const,
  },
  {
    id: 3,
    title: 'Ad-free experience',
    icon: 'remove-circle-outline',
    gradient: ['#43e97b', '#38f9d7'] as const,
  },
  {
    id: 4,
    title: 'Nutritional information',
    icon: 'nutrition-outline',
    gradient: ['#4facfe', '#00f2fe'] as const,
  },
  {
    id: 5,
    title: 'Weekly meal planning',
    icon: 'calendar-outline',
    gradient: ['#ff9a9e', '#fecfef'] as const,
  },
  {
    id: 6,
    title: 'Personalized recipes',
    icon: 'person-outline',
    gradient: ['#a8edea', '#fed6e3'] as const,
  },
];

export default function SubscriptionScreen({ navigation }: SubscriptionScreenProps) {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const { setIsPremium } = useSubscription();

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      const offerings = await purchaseService.getOfferings();
      setPackages(offerings);
    } catch (error) {
      Alert.alert('Error', 'An error occurred while loading packages.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageIdentifier: string) => {
    try {
      setPurchasing(true);
      const success = await purchaseService.purchasePackage(packageIdentifier);
      if (success) {
        setIsPremium(true);
        Alert.alert('Success', 'Your premium subscription is now active!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error: any) {
      if (error?.code !== 'E_USER_CANCELLED') {
        Alert.alert('Error', 'An error occurred during the purchase process.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setLoading(true);
      const success = await purchaseService.restorePurchases();
      if (success) {
        setIsPremium(true);
        Alert.alert('Success', 'Your subscription has been restored!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Info', 'No active subscription found to restore.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore subscription.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        
        {/* Background Gradient */}
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460'] as const}
          style={styles.backgroundGradient}
        />

        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'] as const}
            style={styles.loadingCard}
          >
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Loading subscription plans...</Text>
          </LinearGradient>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460'] as const}
        style={styles.backgroundGradient}
      />

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Ionicons name="close" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <LinearGradient
            colors={['#667eea', '#764ba2'] as const}
            style={styles.premiumIcon}
          >
            <Ionicons name="star" size={32} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.title}>SnapCook AI Premium</Text>
          <Text style={styles.subtitle}>
            Unlock the full potential of AI-powered cooking
          </Text>
          <View style={styles.decorativeLine} />
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Premium Features</Text>
          <View style={styles.featureGrid}>
            {features.map((feature) => (
              <View key={feature.id} style={styles.featureCard}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'] as const}
                  style={styles.featureGradient}
                >
                  <LinearGradient
                    colors={feature.gradient}
                    style={styles.featureIcon}
                  >
                    <Ionicons name={feature.icon as any} size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.featureText}>{feature.title}</Text>
                </LinearGradient>
              </View>
            ))}
          </View>
        </View>

        {packages.length > 0 && (
          <View style={styles.packagesContainer}>
            <Text style={styles.sectionTitle}>Choose Your Plan</Text>
            {packages.map((pkg) => (
              <TouchableOpacity
                key={pkg.identifier}
                style={styles.packageCard}
                onPress={() => handlePurchase(pkg.identifier)}
                disabled={purchasing}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'] as const}
                  style={styles.packageGradient}
                >
                  <View style={styles.packageContent}>
                    <View style={styles.packageInfo}>
                      <Text style={styles.packageTitle}>{pkg.title}</Text>
                      <Text style={styles.packagePeriod}>{pkg.period}</Text>
                    </View>
                    <View style={styles.priceContainer}>
                      <Text style={styles.packagePrice}>{pkg.price}</Text>
                      <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.6)" />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'] as const}
              style={styles.restoreGradient}
            >
              <Ionicons name="refresh-outline" size={20} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.restoreButtonText}>Restore Previous Purchases</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            Payment will be charged to your {Platform.OS === 'ios' ? 'iTunes' : 'Google Play'} account at confirmation of purchase. Subscription automatically renews unless auto-renew is turned off at least 24-hours before the end of the current period. You can manage and cancel your subscription by going to your {Platform.OS === 'ios' ? 'iTunes' : 'Google Play'} account settings.
          </Text>
        </View>
      </ScrollView>

      {purchasing && (
        <View style={styles.loadingOverlay}>
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.9)'] as const}
            style={styles.overlayGradient}
          >
            <View style={styles.purchasingCard}>
              <ActivityIndicator size="large" color="#667eea" />
              <Text style={styles.purchasingText}>Processing your purchase...</Text>
            </View>
          </LinearGradient>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  loadingCard: {
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    right: 25,
    zIndex: 1,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  header: {
    marginTop: 100,
    alignItems: 'center',
    marginBottom: 40,
  },
  premiumIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  decorativeLine: {
    width: 60,
    height: 3,
    backgroundColor: '#667eea',
    borderRadius: 2,
  },
  featuresContainer: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 20,
  },
  packagesContainer: {
    marginBottom: 40,
  },
  packageCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  packageGradient: {
    padding: 24,
  },
  packageContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageInfo: {
    flex: 1,
  },
  packageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  packagePeriod: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  actionsContainer: {
    marginBottom: 30,
  },
  restoreButton: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  restoreGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  termsContainer: {
    paddingBottom: 40,
  },
  termsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  purchasingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  purchasingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
}); 