import { GOOGLE_CLOUD_API_KEY } from '@env';

export interface DetectedIngredient {
  name: string;
  confidence: number;
}

// Common non-food objects that might be detected in food photos
const NON_FOOD_OBJECTS = new Set([
  'plate', 'bowl', 'cup', 'glass', 'fork', 'spoon', 'knife', 'table', 'counter',
  'cutting board', 'kitchen', 'hand', 'finger', 'phone', 'camera', 'window',
  'light', 'container', 'box', 'bag', 'paper', 'cloth', 'textile'
]);

// Common food categories and related terms
const FOOD_CATEGORIES = new Set([
  // Produce
  'fruit', 'vegetable', 'herb', 'mushroom', 'tomato', 'potato', 'onion', 'garlic',
  'carrot', 'lettuce', 'cucumber', 'pepper', 'lemon', 'apple', 'orange', 'banana',
  // Proteins
  'meat', 'fish', 'seafood', 'poultry', 'egg', 'chicken', 'beef', 'pork', 'lamb',
  'turkey', 'salmon', 'tuna', 'shrimp',
  // Dairy
  'dairy', 'cheese', 'milk', 'yogurt', 'cream', 'butter', 'mozzarella', 'cheddar',
  // Grains
  'grain', 'rice', 'pasta', 'bread', 'cereal', 'flour', 'noodle', 'quinoa',
  // Pantry
  'spice', 'herb', 'condiment', 'sauce', 'oil', 'vinegar', 'sugar', 'salt',
  // General
  'food', 'ingredient', 'produce', 'meal', 'dish'
]);

// Common cooking-related verbs to filter out
const COOKING_VERBS = new Set([
  'cooked', 'baked', 'fried', 'grilled', 'roasted', 'boiled', 'steamed',
  'chopped', 'sliced', 'diced', 'minced', 'grated', 'peeled'
]);

// Yiyecek olmayan veya çok genel kategorileri filtrele
const EXCLUDED_TERMS = [
  'Natural Foods',
  'Food Group',
  'Staple Food',
  'Superfood',
  'Food',
  'Produce',
  'Vegetable',
  'Fruit',
  'Leaf Vegetable',
  'Root Vegetables',
  'Cruciferous Vegetables',
  'Tuber',
  'Polemoniaceae',
  'Plant',
  'Vegan',
  'Vegetarian',
  'Organic',
  'Fresh',
  'Raw',
  'Ingredient',
  'Edible',
  'Natural',
  'Whole',
  'Processed',
  'Dish',
  'Meal',
  'Cuisine',
  'Recipe',
  'Cooking',
  'Kitchen',
  'Plate',
  'Bowl',
  'Container',
  'Packaging',
  'Wrapper',
  'Utensil',
  'Napkin',
  'Table',
  'Surface',
];

// Malzeme isimlerini normalize et
const INGREDIENT_MAPPING: { [key: string]: string } = {
  'Roma Tomato': 'Tomato',
  'Cherry Tomato': 'Tomato',
  'Plum Tomato': 'Tomato',
  'Beef Tomato': 'Tomato',
  'Green Onion': 'Scallion',
  'Spring Onion': 'Scallion',
  'Red Onion': 'Onion',
  'White Onion': 'Onion',
  'Yellow Onion': 'Onion',
  'Sweet Potato': 'Potato',
  'Red Potato': 'Potato',
  'White Potato': 'Potato',
  'Yellow Potato': 'Potato',
  'Bell Pepper': 'Pepper',
  'Red Pepper': 'Pepper',
  'Green Pepper': 'Pepper',
  'Yellow Pepper': 'Pepper',
};

// Yaygın malzeme isimleri
const COMMON_INGREDIENTS = [
  'tomato', 'onion', 'garlic', 'potato', 'carrot', 'lettuce', 'cucumber', 'pepper',
  'lemon', 'apple', 'orange', 'banana', 'egg', 'chicken', 'beef', 'cheese',
  'milk', 'butter', 'rice', 'pasta', 'bread', 'mushroom', 'spinach', 'broccoli',
  'celery', 'ginger', 'basil', 'parsley', 'olive', 'avocado', 'corn', 'bean',
  'peas', 'cabbage', 'cauliflower', 'zucchini', 'eggplant', 'radish', 'turnip',
];

function normalizeIngredientName(name: string): string {
  // Mapping varsa kullan
  if (INGREDIENT_MAPPING[name]) {
    return INGREDIENT_MAPPING[name];
  }
  
  // Convert to lowercase
  let normalized = name.toLowerCase();
  
  // Remove common prefixes/suffixes
  normalized = normalized
    .replace(/fresh |frozen |dried |raw |cooked |prepared |whole |chopped |sliced |diced |minced /g, '')
    .replace(/ pieces| slices| chunks| bits/g, '');
  
  // Remove quantities and measurements
  normalized = normalized.replace(/\d+(\.\d+)?\s*(g|kg|oz|lb|ml|l|cup|tbsp|tsp|piece|slice)s?\b/g, '');
  
  // Trim whitespace
  normalized = normalized.trim();
  
  // Capitalize first letter
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function isValidIngredient(name: string): boolean {
  const normalizedName = name.toLowerCase();
  
  // Exclude generic terms
  if (EXCLUDED_TERMS.some(term => term.toLowerCase() === normalizedName)) {
    return false;
  }
  
  // Check if it's a common ingredient
  if (COMMON_INGREDIENTS.some(ingredient => normalizedName.includes(ingredient))) {
    return true;
  }
  
  // Check if it's a food-related term
  const foodKeywords = ['meat', 'fish', 'seafood', 'dairy', 'grain', 'spice', 'herb', 'sauce', 'oil'];
  return foodKeywords.some(keyword => normalizedName.includes(keyword));
}

const CONFIDENCE_THRESHOLD = 0.7;

export async function detectIngredients(imageBase64: string): Promise<DetectedIngredient[]> {
  try {
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          image: {
            content: imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '')
          },
          features: [
            {
              type: 'LABEL_DETECTION',
              maxResults: 50
            },
            {
              type: 'OBJECT_LOCALIZATION',
              maxResults: 50
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Google Cloud Vision API error: ${errorData}`);
    }

    const data: GoogleVisionResponse = await response.json();
    const detectedItems = new Set<string>();
    const confidenceScores: { [key: string]: number } = {};

    // Process label annotations
    data.responses[0].labelAnnotations?.forEach(label => {
      const name = normalizeIngredientName(label.description);
      if (isValidIngredient(name)) {
        detectedItems.add(name);
        // Update confidence score if higher than existing
        if (!confidenceScores[name] || label.score > confidenceScores[name]) {
          confidenceScores[name] = label.score;
        }
      }
    });

    // Process object annotations
    data.responses[0].localizedObjectAnnotations?.forEach(obj => {
      const name = normalizeIngredientName(obj.name);
      if (isValidIngredient(name)) {
        detectedItems.add(name);
        // Update confidence score if higher than existing
        if (!confidenceScores[name] || obj.score > confidenceScores[name]) {
          confidenceScores[name] = obj.score;
        }
      }
    });

    // Convert to array and filter by confidence threshold
    const ingredients: DetectedIngredient[] = Array.from(detectedItems)
      .map(name => ({
        name,
        confidence: confidenceScores[name]
      }))
      .filter(ing => ing.confidence >= CONFIDENCE_THRESHOLD);

    return ingredients;

  } catch (error) {
    console.error('Error detecting ingredients:', error);
    throw error;
  }
}

interface GoogleVisionResponse {
  responses: Array<{
    labelAnnotations?: Array<{
      description: string;
      score: number;
    }>;
    localizedObjectAnnotations?: Array<{
      name: string;
      score: number;
    }>;
  }>;
} 