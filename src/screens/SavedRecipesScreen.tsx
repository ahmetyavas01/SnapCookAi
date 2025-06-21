import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, StatusBar, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../../App';
import { Recipe } from '../services/recipeService';

type SavedRecipesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SavedRecipes'>;

interface Props {
  navigation: SavedRecipesScreenNavigationProp;
}

export default function SavedRecipesScreen({ navigation }: Props) {
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedRecipes();
  }, []);

  const loadSavedRecipes = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedRecipes');
      if (saved) {
        setSavedRecipes(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRecipe = async (recipeId: string) => {
    Alert.alert(
      'Remove Recipe',
      'Are you sure you want to remove this recipe from your saved list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedRecipes = savedRecipes.filter(recipe => recipe.id !== recipeId);
              setSavedRecipes(updatedRecipes);
              await AsyncStorage.setItem('savedRecipes', JSON.stringify(updatedRecipes));
            } catch (error) {
              console.error('Error removing recipe:', error);
            }
          }
        }
      ]
    );
  };

  const handleRecipePress = (recipe: Recipe) => {
    navigation.navigate('Recipe', { recipes: [recipe] });
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => handleRecipePress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.recipeContent}>
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.recipeDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={14} color="#9CA3AF" />
              <Text style={styles.detailText}>{item.cookingTime || '30 min'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="people-outline" size={14} color="#9CA3AF" />
              <Text style={styles.detailText}>{item.servings || 2} servings</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveRecipe(item.id || `recipe-${Date.now()}`)}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading saved recipes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Saved Recipes</Text>
          <Text style={styles.subtitle}>{savedRecipes.length} recipes in your collection</Text>
        </View>
      </View>

      {savedRecipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="bookmark-outline" size={48} color="#6B7280" />
          </View>
          <Text style={styles.emptyTitle}>No Saved Recipes</Text>
          <Text style={styles.emptySubtitle}>
            Start cooking and save your favorite AI-generated recipes here
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Ionicons name="sparkles" size={20} color="#FFFFFF" />
            <Text style={styles.exploreButtonText}>Discover Recipes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={savedRecipes}
          renderItem={renderRecipeItem}
          keyExtractor={(item) => item.id || `recipe-${Date.now()}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 17,
    color: '#9CA3AF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 4,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  recipeCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    marginBottom: 16,
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
  recipeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  recipeDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  removeButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#1F1F1F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#2D2D2D',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 17,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    fontWeight: '400',
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  exploreButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 