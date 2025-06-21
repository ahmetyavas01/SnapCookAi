import React, { useEffect, useState } from 'react';
import { StyleSheet, Platform, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  Home: undefined;
  PhotoMode: undefined;
  IngredientMode: undefined;
  DetectedIngredients: {
    imageBase64: string;
  };
  Recipe: {
    recipes: Recipe[];
  };
  SavedRecipes: undefined;
  Settings: undefined;
  Subscription: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: '#1C1C1E',
        },
        tabBarActiveTintColor: '#0A84FF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Saved"
        component={SavedRecipesScreen}
        options={{
          title: "Favorites",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Custom tabBar to center icons and labels
function CustomTabBar(props: BottomTabBarProps) {
  const { state, descriptors, navigation, insets } = props;
  return (
    <View
      style={[
        styles.tabBar,
        Platform.OS === 'ios'
          ? { backgroundColor: 'transparent' }
          : { backgroundColor: COLORS.background.secondary },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel.toString()
            : options.title !== undefined
            ? options.title.toString()
            : route.name;

        const isFocused = state.index === index;

        let iconName: any;
        switch (route.name) {
          case 'Home':
            iconName = isFocused ? 'home' : 'home-outline';
            break;
          case 'Saved':
            iconName = isFocused ? 'bookmark' : 'bookmark-outline';
            break;
          case 'Settings':
            iconName = isFocused ? 'settings' : 'settings-outline';
            break;
          default:
            iconName = 'help-outline';
        }

        // Hide Recipe tab
        if (route.name === 'Recipe') {
          return null;
        }

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <View key={route.key} style={styles.tabItemContainer}>
            <View style={styles.tabItemInner}>
              <Ionicons
                name={iconName}
                size={24}
                color={isFocused ? COLORS.systemBlue : COLORS.text.tertiary}
                style={styles.tabIcon}
              />
              <View style={styles.tabLabelWrapper}>
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isFocused ? COLORS.systemBlue : COLORS.text.tertiary },
                  ]}
                  onPress={onPress}
                  onLongPress={onLongPress}
                >
                  {label}
                </Text>
              </View>
            </View>
            {/* Touchable area covers both icon and label */}
            <View
              style={StyleSheet.absoluteFill}
              pointerEvents="box-none"
            >
              <View
                style={StyleSheet.absoluteFill}
                onTouchEnd={onPress}
                onTouchStart={onLongPress}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function App() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (hasLaunched === null) {
        await AsyncStorage.setItem('hasLaunched', 'true');
        setIsFirstLaunch(true);
      } else {
        setIsFirstLaunch(false);
      }
    } catch (error) {
      console.error('Error checking first launch:', error);
      setIsFirstLaunch(false);
    }
  };

  if (isFirstLaunch === null) {
    return null; // Loading state
  }

  return (
    <NavigationContainer>
      <AuthProvider>
        <LoadingProvider>
          <SubscriptionProvider>
            <AppProvider>
              <Stack.Navigator
                initialRouteName="Guide"
                screenOptions={{
                  headerShown: false,
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="Guide" component={GuideScreen} />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="PhotoMode" component={PhotoModeScreen} />
                <Stack.Screen name="IngredientMode" component={IngredientModeScreen} />
                <Stack.Screen name="DetectedIngredients" component={DetectedIngredientsScreen} />
                <Stack.Screen name="Recipe" component={RecipeScreen} />
                <Stack.Screen name="SavedRecipes" component={SavedRecipesScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="Subscription" component={SubscriptionScreen} />
              </Stack.Navigator>
            </AppProvider>
          </SubscriptionProvider>
        </LoadingProvider>
      </AuthProvider>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
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
