// Simplified English-only text resources
const texts = {
  home_title: 'Recipe AI',
  home_subtitle: 'Choose your input method',
  ingredients: 'Ingredients',
  photo: 'Photo',
  enter_ingredients: 'Enter ingredients you have',
  take_photo: 'Take a photo of ingredients',
  saved_recipes: 'Saved Recipes',
  go_premium: 'Go Premium',
  settings: 'Settings',
  switch_to_turkish: 'Switch to Turkish',
  switch_to_english: 'Switch to English',
  saved_recipes_title: 'Saved Recipes',
  no_saved_recipes: 'No saved recipes yet',
  delete_recipe_confirm: 'Delete Recipe',
  delete_recipe_question: 'Are you sure you want to delete "{title}"?',
  cancel: 'Cancel',
  delete: 'Delete',
};

// Simple hook that just returns English text
export const useTranslation = () => {
  const t = (key: keyof typeof texts, params?: { [key: string]: string }) => {
    let text = texts[key] || key;
    
    // Simple parameter replacement
    if (params) {
      Object.keys(params).forEach(param => {
        text = text.replace(`{${param}}`, params[param]);
      });
    }
    
    return text;
  };

  return { t };
}; 