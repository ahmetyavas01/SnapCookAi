import { OPENAI_API_KEY } from '@env';
import KeyManagementService from './keyManagementService';
import UsageService from './usageService';
import { Alert } from 'react-native';

export interface Nutrition {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

export interface Recipe {
  id?: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: string;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: string;
  mealType: string;
  nutrition: Nutrition;
  createdAt?: Date;
}

export async function generateRecipe(
  ingredients: string[],
  cuisine: string,
  mealType: string,
  servings: number = 4
): Promise<Recipe[]> {
  try {
    // Check usage limits first
    const usageService = UsageService.getInstance();
    const canUseService = await usageService.canUseService();
    
    if (!canUseService.allowed) {
      Alert.alert(
        'Usage Limit Reached',
        'You have reached your daily limit. Upgrade to premium for more credits!',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Get Premium', 
            onPress: () => {
              // @ts-ignore - Navigation will be handled by the component
              global.navigation?.navigate('Subscription');
            }
          }
        ]
      );
      return [];
    }

    const keyManager = KeyManagementService.getInstance();
    const apiKey = await keyManager.getApiKey('OPENAI');
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found');
    }

    const ingredientsList = ingredients.join(', ');
    const prompt = `You are a professional chef and nutritionist.\n\nGenerate exactly 3 different ${cuisine} ${mealType} recipes using ONLY the following ingredients: ${ingredientsList}. \nEach recipe must serve exactly ${servings} people, and each should have a different cooking style.\n\n❗ IMPORTANT: For each recipe, you MUST calculate and include detailed nutrition values PER SERVING (calories, carbs in grams, protein in grams, and fat in grams). These values should be realistic and based on the ingredients and portions used.\n\n❗ Respond STRICTLY in JSON format.\nDo not add explanations, text, or markdown.\n\nExpected format:\n{\n  "recipes": [\n    {\n      "title": "string",\n      "ingredients": ["string (with EXACT amounts)"],
      "instructions": ["string (step-by-step)"],
      "cookingTime": "string (e.g. 30 minutes)",
      "servings": number,
      "difficulty": "easy | medium | hard",
      "nutrition": {\n        "calories": number (per serving),\n        "carbs": number (grams per serving),\n        "protein": number (grams per serving),\n        "fat": number (grams per serving)\n      }\n    },\n    ...\n  ]\n}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-nano',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI error: ${err}`);
    }

    const data = await response.json();
    
    // API çağrısı başarılı olduysa kullanım sayısını artır
    await usageService.incrementUsage();

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    const parsed = JSON.parse(content);
    return parsed.recipes as Recipe[];
  } catch (error) {
    console.error('Error generating recipe:', error);
    throw error;
  }
}

const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const getCuisineName = (cuisineId: string): string => {
  const cuisineMap: { [key: string]: string } = {
    'tr': 'Turkish',
    'it': 'Italian',
    'jp': 'Japanese',
    'mx': 'Mexican',
    'in': 'Indian',
    'fr': 'French',
    'gr': 'Greek',
    'th': 'Thai'
  };
  return cuisineMap[cuisineId] || cuisineId;
};

const getMealTypeName = (mealTypeId: string): string => {
  const mealTypeMap: { [key: string]: string } = {
    'breakfast': 'Breakfast',
    'lunch': 'Lunch',
    'dinner': 'Dinner',
    'dessert': 'Dessert',
    'snack': 'Snack'
  };
  return mealTypeMap[mealTypeId] || mealTypeId;
};

export async function saveRecipe(recipe: Recipe): Promise<void> {
  // Implementation for saving recipe
}

export async function getSavedRecipes(): Promise<Recipe[]> {
  // Implementation for getting saved recipes
  return [];
}

export async function deleteRecipe(recipeId: string): Promise<void> {
  // Implementation for deleting recipe
} 