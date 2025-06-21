import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Alert,
  TextInput,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { useLoading } from '../context/LoadingContext';
import { useApp, COUNTRIES, Country, MEAL_TYPES, MealType, ACTION_TYPES } from '../context/AppContext';
import { generateRecipe } from '../services/recipeService';

type IngredientModeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'IngredientMode'>;
};

export default function IngredientModeScreen({ navigation }: IngredientModeScreenProps) {
  const { state, dispatch } = useApp();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [personCount, setPersonCount] = useState(2);
  const { show, hide } = useLoading();

  const handleAddIngredient = () => {
    const trimmed = newIngredient.trim();
    if (!trimmed) return;
    if (trimmed.length < 2) {
      Alert.alert('Warning', 'Ingredient name is too short');
      return;
    }
    if (ingredients.some(i => i.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Warning', 'Ingredient already added');
      return;
    }
    
    const updatedIngredients = [...ingredients, trimmed];
    setIngredients(updatedIngredients);
    dispatch({ type: ACTION_TYPES.SET_INGREDIENTS, payload: updatedIngredients });
    setNewIngredient('');
    Keyboard.dismiss();
  };

  const handleRemoveIngredient = (index: number) => {
    const updatedIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(updatedIngredients);
    dispatch({ type: ACTION_TYPES.SET_INGREDIENTS, payload: updatedIngredients });
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    dispatch({ type: ACTION_TYPES.SET_CUISINE, payload: country.id });
  };

  const handleMealTypeSelect = (mealType: MealType) => {
    setSelectedMealType(mealType);
  };

  const handleContinue = async () => {
    if (!ingredients.length || !selectedCountry || !selectedMealType) {
      Alert.alert('Missing Information', 'Please add ingredients and select cuisine and meal type');
      return;
    }

    try {
      show('Creating your perfect recipes...');
      const recipes = await generateRecipe(
        ingredients,
        selectedCountry.id,
        selectedMealType.id,
        personCount
      );
      if (recipes && recipes.length) {
        navigation.navigate('Recipe', { recipes });
      } else {
        Alert.alert('Error', 'No recipes generated.');
      }
    } catch (error) {
      console.error('Error generating recipes:', error);
      Alert.alert('Error', 'Failed to generate recipes');
    } finally {
      hide();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
            <Text style={styles.title}>Manual Entry</Text>
            <Text style={styles.subtitle}>Add ingredients manually</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Add Ingredient */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Ingredients</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={newIngredient}
                onChangeText={setNewIngredient}
                placeholder="Enter ingredient name"
                placeholderTextColor="#6B7280"
                onSubmitEditing={handleAddIngredient}
                returnKeyType="done"
              />
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleAddIngredient}
              >
                <Ionicons name="add" size={20} color="#6366F1" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Ingredients List */}
          {ingredients.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredients ({ingredients.length})</Text>
              <View style={styles.ingredientsGrid}>
                {ingredients.map((item, index) => (
                  <View key={`${item}-${index}`} style={styles.ingredientChip}>
                    <Text style={styles.ingredientText}>{item}</Text>
                    <TouchableOpacity 
                      onPress={() => handleRemoveIngredient(index)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="close" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Cuisine Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cuisine Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.optionsRow}>
                {COUNTRIES.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.optionButton,
                      selectedCountry?.id === item.id && styles.selectedOption
                    ]}
                    onPress={() => handleCountrySelect(item)}
                  >
                    <Text style={[
                      styles.optionText,
                      selectedCountry?.id === item.id && styles.selectedOptionText
                    ]}>{item.flag} {item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Meal Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meal Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.optionsRow}>
                {MEAL_TYPES.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.optionButton,
                      selectedMealType?.id === item.id && styles.selectedOption
                    ]}
                    onPress={() => handleMealTypeSelect(item)}
                  >
                    <Text style={[
                      styles.optionText,
                      selectedMealType?.id === item.id && styles.selectedOptionText
                    ]}>{item.icon} {item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Servings */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Servings</Text>
            <View style={styles.counterContainer}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setPersonCount(Math.max(1, personCount - 1))}
              >
                <Ionicons name="remove" size={16} color="#6366F1" />
              </TouchableOpacity>
              <Text style={styles.personCount}>{personCount}</Text>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setPersonCount(personCount + 1)}
              >
                <Ionicons name="add" size={16} color="#6366F1" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Generate Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity 
            style={[
              styles.generateButton,
              (!ingredients.length || !selectedCountry || !selectedMealType) && styles.disabledButton
            ]}
            onPress={handleContinue}
            disabled={!ingredients.length || !selectedCountry || !selectedMealType}
          >
            <View style={styles.generateContent}>
              <Ionicons 
                name="sparkles" 
                size={20} 
                color={(!ingredients.length || !selectedCountry || !selectedMealType) 
                  ? "#6B7280" : "#FFFFFF"} 
              />
              <Text style={[
                styles.generateButtonText,
                (!ingredients.length || !selectedCountry || !selectedMealType) && styles.disabledButtonText
              ]}>
                Generate AI Recipes
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#1F1F1F',
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    height: 48,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ingredientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D2D2D',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  ingredientText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  removeButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 24,
  },
  optionButton: {
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  optionText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F1F1F',
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#2D2D2D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  personCount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    minWidth: 24,
    textAlign: 'center',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
  },
  generateButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 18,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  generateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#2D2D2D',
    shadowOpacity: 0,
    elevation: 0,
  },
  generateButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButtonText: {
    color: '#6B7280',
  },
}); 