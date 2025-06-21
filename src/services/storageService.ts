import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe } from './recipeService';

const SAVED_RECIPES_KEY = 'saved_recipes';

export const saveRecipe = async (recipe: Recipe): Promise<void> => {
  try {
    const savedRecipes = await getSavedRecipes();
    const updatedRecipes = [...savedRecipes, recipe];
    await AsyncStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(updatedRecipes));
  } catch (error) {
    console.error('Error saving recipe:', error);
    throw new Error('Failed to save recipe');
  }
};

export const getSavedRecipes = async (): Promise<Recipe[]> => {
  try {
    const savedRecipesJson = await AsyncStorage.getItem(SAVED_RECIPES_KEY);
    if (!savedRecipesJson) return [];

    const parsed: Recipe[] = JSON.parse(savedRecipesJson);

    // Ensure createdAt is a Date instance for correct sorting and display
    return parsed.map((recipe) => ({
      ...recipe,
      createdAt: recipe.createdAt ? new Date(recipe.createdAt) : undefined,
    }));
  } catch (error) {
    console.error('Error getting saved recipes:', error);
    return [];
  }
};

export const deleteSavedRecipe = async (recipeId: string): Promise<void> => {
  try {
    const savedRecipes = await getSavedRecipes();
    const updatedRecipes = savedRecipes.filter(recipe => recipe.id !== recipeId);
    await AsyncStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(updatedRecipes));
  } catch (error) {
    console.error('Error deleting recipe:', error);
    throw new Error('Failed to delete recipe');
  }
};

export const clearSavedRecipes = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SAVED_RECIPES_KEY);
  } catch (error) {
    console.error('Error clearing saved recipes:', error);
    throw new Error('Failed to clear saved recipes');
  }
}; 