import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { COLORS } from '../utils/colors';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';

type GuideScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Guide'>;
};

const { width, height } = Dimensions.get('window');

const features = [
  {
    id: 1,
    title: 'Photo Ingredient Detection',
    description: 'Take a photo of your ingredients and let AI detect them automatically.',
    animation: require('../../assets/anime2.json'),
    gradient: ['#667eea', '#764ba2'] as const,
    accentColor: '#667eea',
  },
  {
    id: 2,
    title: 'Smart Recipe Suggestions',
    description: 'Get delicious recipe recommendations based on your available ingredients.',
    animation: require('../../assets/onboarding2.json'),
    gradient: ['#f093fb', '#f5576c'] as const,
    accentColor: '#f093fb',
  },
  {
    id: 3,
    title: 'Global Cuisines',
    description: 'Explore recipes from various cuisines including Italian, Turkish, Mexican, and more.',
    animation: require('../../assets/anime1.json'),
    gradient: ['#4facfe', '#00f2fe'] as const,
    accentColor: '#4facfe',
  },
  {
    id: 4,
    title: 'Save Recipes',
    description: 'Save your favorite recipes for quick access anytime.',
    animation: require('../../assets/cooking.json'),
    gradient: ['#43e97b', '#38f9d7'] as const,
    accentColor: '#43e97b',
  },
];

export default function GuideScreen({ navigation }: GuideScreenProps) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: true }
  );

  const renderFeature = ({ item, index }: { item: typeof features[0]; index: number }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.85, 1, 0.85],
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [50, 0, 50],
    });

    return (
      <View style={styles.featureContainer}>
        <Animated.View
          style={[
            styles.featureCard,
            { 
              transform: [{ scale }, { translateY }], 
              opacity 
            },
          ]}
        >
          <LinearGradient
            colors={item.gradient}
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.animationContainer}>
              <LottieView
                source={item.animation}
                autoPlay
                loop
                style={styles.animation}
              />
            </View>
          </LinearGradient>
          
          <View style={styles.contentContainer}>
            <Text style={styles.featureTitle}>{item.title}</Text>
            <Text style={styles.featureDescription}>{item.description}</Text>
          </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460'] as const}
        style={styles.backgroundGradient}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>SnapCook AI</Text>
        <Text style={styles.subtitle}>
          Your AI-powered smart kitchen assistant
        </Text>
        <View style={styles.decorativeLine} />
      </View>

      {/* Features Carousel */}
      <View style={styles.carouselContainer}>
        <Animated.FlatList
          data={features}
          renderItem={renderFeature}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          onMomentumScrollEnd={(e) => {
            const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentIndex(newIndex);
          }}
          decelerationRate="fast"
          snapToInterval={width}
          snapToAlignment="center"
        />
      </View>

      {/* Enhanced Pagination */}
      <View style={styles.pagination}>
        {features.map((feature, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const scaleX = scrollX.interpolate({
            inputRange,
            outputRange: [1, 3, 1],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.paginationDot,
                {
                  transform: [{ scaleX }],
                  opacity,
                  backgroundColor: currentIndex === index 
                    ? feature.accentColor 
                    : 'rgba(255, 255, 255, 0.3)',
                },
              ]}
            />
          );
        })}
      </View>

      {/* Footer with Enhanced Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={() => navigation.replace('Home')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2'] as const}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={styles.skipContainer}>
          <Text style={styles.skipText}>
            Ready to discover amazing recipes?
          </Text>
        </View>
      </View>
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
  header: {
    paddingTop: 20,
    paddingHorizontal: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '400',
    lineHeight: 24,
  },
  decorativeLine: {
    width: 60,
    height: 3,
    backgroundColor: '#667eea',
    marginTop: 20,
    borderRadius: 2,
  },
  carouselContainer: {
    flex: 1,
    marginTop: 20,
  },
  featureContainer: {
    width: width,
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  featureCard: {
    width: width - 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  gradientBackground: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  animationContainer: {
    width: 180,
    height: 180,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  animation: {
    width: 140,
    height: 140,
  },
  contentContainer: {
    padding: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  featureTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  featureDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  footer: {
    padding: 25,
    paddingBottom: 40,
  },
  getStartedButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  skipContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '400',
  },
}); 