import React, { useEffect, useState } from 'react';
import { StyleSheet, Platform, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import LottieView from 'lottie-react-native';

import { SubscriptionProvider } from './src/context/SubscriptionContext';
import { LoadingProvider } from './src/context/LoadingContext';
import { AppProvider } from './src/context/AppContext';
import { useTranslation } from './src/utils/i18n';
import { COLORS } from './src/utils/colors';
import { Recipe } from './src/services/recipeService';
import { AuthProvider } from './src/context/AuthContext';

// Screens
import DetectedIngredientsScreen from './src/screens/DetectedIngredientsScreen';
import HomeScreen from './src/screens/HomeScreen';
import IngredientModeScreen from './src/screens/IngredientModeScreen';
import PhotoModeScreen from './src/screens/PhotoModeScreen';
import RecipeScreen from './src/screens/RecipeScreen';
import SavedRecipesScreen from './src/screens/SavedRecipesScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import GuideScreen from './src/screens/GuideScreen';

export type RootStackParamList = {
  Guide: undefined;
  Main: undefined;
  Home: undefined;
  Saved: undefined;
  Settings: undefined;
  PhotoMode: undefined;
  IngredientMode: undefined;
  DetectedIngredients: {
    imageBase64: string;
  };
  Recipe: {
    recipes: Recipe[];
  };
  SavedRecipes: undefined;
  Subscription: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Custom Lottie Splash Screen Component
function LottieSplashScreen({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    // Auto hide after 3 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.splashContainer}>
      <LottieView
        source={require('./assets/cooking.json')}
        autoPlay
        loop={false}
        style={styles.lottieAnimation}
        onAnimationFinish={onFinish}
      />
    </View>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Saved') {
            iconName = focused ? 'bookmark' : 'bookmark-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#1E293B',
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 34 : 8,
          height: Platform.OS === 'ios' ? 90 : 85,
          position: 'absolute',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
          marginHorizontal: 4,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView 
              intensity={40}
              tint="systemMaterialDark"
              style={{
                flex: 1,
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                borderTopWidth: 1,
                borderTopColor: 'rgba(51, 65, 85, 0.6)',
              }}
            />
          ) : (
            <View style={{
              flex: 1,
              backgroundColor: '#1E293B',
              borderTopWidth: 1,
              borderTopColor: '#334155',
            }} />
          )
        ),
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Saved" 
        component={SavedRecipesScreen}
        options={{
          title: 'Favorites',
          tabBarLabel: 'Favorites',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isShowingSplash, setIsShowingSplash] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        // This is where you can initialize services, load cached data, etc.
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = React.useCallback(async () => {
    if (appIsReady && !isShowingSplash) {
      // Hide the native splash screen
      await SplashScreen.hideAsync();
    }
  }, [appIsReady, isShowingSplash]);

  const handleSplashFinish = () => {
    setIsShowingSplash(false);
  };

  if (!appIsReady || isShowingSplash) {
    return <LottieSplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <StatusBar style="light" backgroundColor="#0F172A" />
      <AppProvider>
        <AuthProvider>
          <LoadingProvider>
            <SubscriptionProvider>
              <NavigationContainer>
                <Stack.Navigator
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#0F172A' },
                  }}
                >
                  <Stack.Screen name="Main" component={TabNavigator} />
                  <Stack.Screen name="PhotoMode" component={PhotoModeScreen} />
                  <Stack.Screen name="IngredientMode" component={IngredientModeScreen} />
                  <Stack.Screen 
                    name="DetectedIngredients" 
                    component={DetectedIngredientsScreen} 
                  />
                  <Stack.Screen name="Recipe" component={RecipeScreen} />
                  <Stack.Screen 
                    name="Subscription" 
                    component={SubscriptionScreen}
                    options={{
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                    }}
                  />
                  <Stack.Screen name="Guide" component={GuideScreen} />
                </Stack.Navigator>
              </NavigationContainer>
            </SubscriptionProvider>
          </LoadingProvider>
        </AuthProvider>
      </AppProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieAnimation: {
    width: 200,
    height: 200,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopColor: COLORS.separator.default,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    paddingTop: 12,
    elevation: 0,
    zIndex: 1,
  },
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabItemContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabLabelWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 0,
  },
});
