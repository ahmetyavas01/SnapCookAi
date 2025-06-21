import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Recipe } from '../services/recipeService';
import { useTheme } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface RecipeCardProps {
  recipe: Recipe;
  onPress: (recipe: Recipe) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onPress }) => {
  const theme = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.dark 
            ? theme.colors.card 
            : theme.colors.background,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
      onPress={() => onPress(recipe)}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {recipe.title}
        </Text>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: theme.colors.primary + '20' }]}>
            <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
              {recipe.cuisine}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: theme.colors.primary + '20' }]}>
            <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
              {recipe.mealType}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons 
            name="clock-outline" 
            size={16} 
            color={theme.colors.text} 
          />
          <Text style={[styles.infoText, { color: theme.colors.text }]}>
            {recipe.cookingTime}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons 
            name="account-group-outline" 
            size={16} 
            color={theme.colors.text} 
          />
          <Text style={[styles.infoText, { color: theme.colors.text }]}>
            {recipe.servings} servings
          </Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons 
            name="chef-hat" 
            size={16} 
            color={theme.colors.text} 
          />
          <Text style={[styles.infoText, { color: theme.colors.text }]}>
            {recipe.difficulty}
          </Text>
        </View>
      </View>

      <View style={styles.nutritionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Nutrition per serving
        </Text>
        <View style={styles.nutritionGrid}>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
              {recipe.nutrition.calories}
            </Text>
            <Text style={[styles.nutritionLabel, { color: theme.colors.text }]}>
              calories
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
              {recipe.nutrition.carbs}g
            </Text>
            <Text style={[styles.nutritionLabel, { color: theme.colors.text }]}>
              carbs
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
              {recipe.nutrition.protein}g
            </Text>
            <Text style={[styles.nutritionLabel, { color: theme.colors.text }]}>
              protein
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
              {recipe.nutrition.fat}g
            </Text>
            <Text style={[styles.nutritionLabel, { color: theme.colors.text }]}>
              fat
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 14,
  },
  nutritionContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ccc',
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  nutritionLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
}); 