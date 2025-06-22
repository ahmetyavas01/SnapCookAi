import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';
import { useSubscription } from '../context/SubscriptionContext';
import UsageService from '../services/usageService';

import { RootStackParamList } from '../../App';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/i18n';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { state } = useApp();
  const { t } = useTranslation();
  const { isPremium } = useSubscription();
  const [usageStats, setUsageStats] = React.useState<{
    used: number;
    limit: number;
  } | null>(null);

  React.useEffect(() => {
    loadUsageStats();
  }, []);

  const loadUsageStats = async () => {
    try {
      const usageService = UsageService.getInstance();
      const stats = await usageService.getUsageStats();
      setUsageStats(stats);
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  };

  const features = [
    {
      id: 1,
      title: 'AI Photo Detection',
      subtitle: 'Snap a photo and let AI identify your ingredients instantly',
      icon: 'camera',
      onPress: () => navigation.navigate('PhotoMode'),
      color: '#6366F1',
    },
    {
      id: 2,
      title: 'Manual Entry',
      subtitle: 'Type ingredients manually for precise control',
      icon: 'create',
      onPress: () => navigation.navigate('IngredientMode'),
      color: '#10B981',
    },
    {
      id: 3,
      title: 'Saved Recipes',
      subtitle: 'Access your curated collection of favorite recipes',
      icon: 'bookmark',
      onPress: () => navigation.navigate('Saved'),
      color: '#F59E0B',
    },
  ];

  const renderFeatureButton = (
    icon: string,
    title: string,
    description: string,
    onPress: () => void,
    color: string = COLORS.primary,
    key: number
  ) => (
    <TouchableOpacity
      key={key}
      style={styles.featureButton}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>
              {(() => {
                const currentHour = new Date().getHours();
                if (currentHour >= 6 && currentHour < 12) return 'Good morning 🌅';
                if (currentHour >= 12 && currentHour < 18) return 'Good afternoon ☀️';
                return 'Good evening 🌙';
              })()}
            </Text>
            <Text style={styles.title}>SnapCook AI</Text>
            <Text style={styles.subtitle}>Your intelligent kitchen companion</Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {features.map((feature) => 
            renderFeatureButton(
              feature.icon,
              feature.title,
              feature.subtitle,
              feature.onPress,
              feature.color,
              feature.id
            )
          )}
        </View>

        {/* Premium Section */}
        <View style={styles.premiumSection}>
          <TouchableOpacity
            style={styles.premiumButton}
            onPress={() => navigation.navigate('Subscription' as never)}
          >
            <View style={styles.premiumContent}>
              <Ionicons name={isPremium ? "star" : "star-outline"} size={20} color={COLORS.primary} />
              <Text style={styles.premiumText}>
                {isPremium ? 'Premium' : 'Get Premium'}
              </Text>
            </View>
            {isPremium && usageStats && (
              <Text style={styles.usageText}>
                {usageStats.used}/{usageStats.limit} credits left today
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* AI Insights Card */}
        <View style={styles.insightsSection}>
          <View style={styles.insightsCard}>
            <View style={styles.insightsHeader}>
              <View style={styles.insightsIcon}>
                <Ionicons name="sparkles" size={20} color="#6366F1" />
              </View>
              <Text style={styles.insightsTitle}>AI Insights</Text>
            </View>
            <Text style={styles.insightsText}>
              Discover personalized recipes based on your cooking patterns and preferences
            </Text>
            <TouchableOpacity style={styles.insightsButton}>
              <Text style={styles.insightsButtonText}>Explore Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Changed from 'flex-start' to 'center' for alignment
  },
  greetingContainer: {
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 8,
    fontWeight: '500',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    lineHeight: 24,
    fontWeight: '400',
  },
  featuresContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  featureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1F1F',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2D2D2D',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  featureDescription: {
    fontSize: 15,
    color: '#9CA3AF',
    lineHeight: 20,
    fontWeight: '400',
  },
  premiumSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  premiumButton: {
    backgroundColor: COLORS.primary + '10',
    padding: 12, // Reduced padding for less prominence
    borderRadius: 16,
    marginBottom: 24,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4, // Reduced gap for tighter layout
  },
  premiumText: {
    color: COLORS.primary,
    fontSize: 14, // Reduced font size for less prominence
    fontWeight: '500', // Reduced font weight for less prominence
  },
  usageText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.8,
  },
  insightsSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  insightsCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightsIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  insightsText: {
    fontSize: 16,
    color: '#9CA3AF',
    lineHeight: 24,
    marginBottom: 20,
  },
  insightsButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  insightsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 