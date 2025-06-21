import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  SafeAreaView, 
  StatusBar,
  Share,
  FlatList,
  Dimensions,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../../App';
import { Recipe } from '../services/recipeService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Recipe'>;
  route: RouteProp<RootStackParamList, 'Recipe'>;
};

const { width: screenWidth } = Dimensions.get('window');

export default function RecipeScreen({ route, navigation }: Props) {
  const { recipes } = route.params;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const flatListRef = useRef<FlatList>(null);

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
    }
  };

  const isRecipeSaved = (recipe: Recipe): boolean => {
    return savedRecipes.some(saved => saved.id === recipe.id);
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    try {
      const recipeToSave = { ...recipe, id: recipe.id || generateId() };
      
      if (isRecipeSaved(recipeToSave)) {
        const updatedRecipes = savedRecipes.filter(saved => saved.id !== recipeToSave.id);
        setSavedRecipes(updatedRecipes);
        await AsyncStorage.setItem('savedRecipes', JSON.stringify(updatedRecipes));
        Alert.alert('Removed', 'Recipe removed from saved recipes');
      } else {
        const updatedRecipes = [...savedRecipes, recipeToSave];
        setSavedRecipes(updatedRecipes);
        await AsyncStorage.setItem('savedRecipes', JSON.stringify(updatedRecipes));
        Alert.alert('Saved', 'Recipe saved to your collection');
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      Alert.alert('Error', 'Failed to save recipe');
    }
  };

  const generateId = (): string => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  const handleShare = async (recipe: Recipe) => {
    try {
      const shareContent = `${recipe.title}\n\nIngredients:\n${recipe.ingredients.join('\n')}\n\nInstructions:\n${recipe.instructions.join('\n')}`;
      await Share.share({
        message: shareContent,
        title: recipe.title,
      });
    } catch (error) {
      console.error('Error sharing recipe:', error);
    }
  };

  const onScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    
    if (roundIndex !== currentIndex) {
      setCurrentIndex(roundIndex);
    }
  };

  const renderRecipe = ({ item: recipe, index }: { item: Recipe; index: number }) => (
    <View style={styles.recipeContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Recipe Header */}
        <View style={styles.recipeHeader}>
          <Text style={styles.recipeTitle}>{recipe.title}</Text>
          <View style={styles.recipeMetaRow}>
            <View style={styles.metaItem}>
              <View style={styles.metaIconContainer}>
                <Ionicons name="time-outline" size={16} color="#6366F1" />
              </View>
              <Text style={styles.metaText}>{recipe.cookingTime || '30 min'}</Text>
            </View>
            <View style={styles.metaItem}>
              <View style={styles.metaIconContainer}>
                <Ionicons name="people-outline" size={16} color="#10B981" />
              </View>
              <Text style={styles.metaText}>{recipe.servings || 2} servings</Text>
            </View>
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="list-outline" size={20} color="#6366F1" />
            </View>
            <Text style={styles.sectionTitle}>Ingredients</Text>
          </View>
          <View style={styles.ingredientsList}>
            {recipe.ingredients.map((ingredient, idx) => (
              <View key={idx} style={styles.ingredientItem}>
                <View style={styles.ingredientBullet} />
                <Text style={styles.ingredientText}>{ingredient}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Nutrition */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="nutrition-outline" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.sectionTitle}>Nutrition (per serving)</Text>
          </View>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{recipe.nutrition?.calories || 0}</Text>
              <Text style={styles.nutritionLabel}>Calories</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{recipe.nutrition?.carbs || 0}g</Text>
              <Text style={styles.nutritionLabel}>Carbs</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{recipe.nutrition?.protein || 0}g</Text>
              <Text style={styles.nutritionLabel}>Protein</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{recipe.nutrition?.fat || 0}g</Text>
              <Text style={styles.nutritionLabel}>Fat</Text>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="document-text-outline" size={20} color="#10B981" />
            </View>
            <Text style={styles.sectionTitle}>Instructions</Text>
          </View>
          <View style={styles.instructionsList}>
            {recipe.instructions.map((instruction, idx) => (
              <View key={idx} style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{idx + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* AI Generated Badge */}
        <View style={styles.aiBadgeSection}>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={24} color="#6366F1" />
          
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const currentRecipe = recipes[currentIndex];

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
          <Text style={styles.headerTitle}>AI Recipe</Text>
          {recipes.length > 1 && (
            <Text style={styles.headerSubtitle}>
              {currentIndex + 1} of {recipes.length}
            </Text>
          )}
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              isRecipeSaved(currentRecipe) && styles.savedActionButton
            ]}
            onPress={() => handleSaveRecipe(currentRecipe)}
          >
            <Ionicons
              name={isRecipeSaved(currentRecipe) ? "bookmark" : "bookmark-outline"}
              size={24}
              color={isRecipeSaved(currentRecipe) ? "#43e97b" : "#9CA3AF"}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShare(currentRecipe)}
          >
            <Ionicons name="share-outline" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Recipe Carousel */}
      <FlatList
        ref={flatListRef}
        data={recipes}
        renderItem={renderRecipe}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(item, index) => `${item.id || index}`}
        getItemLayout={(data, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
      />

      {/* Page Indicators */}
      {recipes.length > 1 && (
        <View style={styles.pageIndicators}>
          {recipes.map((_, index) => (
            <View
              key={index}
              style={[
                styles.pageIndicator,
                index === currentIndex && styles.pageIndicatorActive
              ]}
            />
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#2D2D2D',
  },
  savedActionButton: {
    backgroundColor: '#1a472a',
  },
  recipeContainer: {
    width: screenWidth,
    paddingHorizontal: 24,
  },
  recipeHeader: {
    paddingVertical: 24,
  },
  recipeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  recipeMetaRow: {
    flexDirection: 'row',
    gap: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2D2D2D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#1F1F1F',
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2D2D2D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  ingredientsList: {
    gap: 12,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366F1',
  },
  ingredientText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    flex: 1,
  },
  instructionsList: {
    gap: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  instructionText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
    flex: 1,
    fontWeight: '400',
  },
  aiBadgeSection: {
    paddingVertical: 20,
  },
  aiBadge: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  aiBadgeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 40,
  },
  pageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2D2D2D',
    marginHorizontal: 4,
  },
  pageIndicatorActive: {
    backgroundColor: '#6366F1',
    width: 24,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
}); 