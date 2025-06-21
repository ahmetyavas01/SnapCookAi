import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Alert,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
  StatusBar,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../App';
import { useLoading } from '../context/LoadingContext';
import { detectIngredients, DetectedIngredient } from '../services/visionService';
import { COLORS } from '../utils/colors';
import { useApp } from '../context/AppContext';
import { COUNTRIES, Country, MEAL_TYPES, MealType, ACTION_TYPES } from '../context/AppContext';
import { generateRecipe } from '../services/recipeService';
import { useAuth } from '../context/AuthContext';

type DetectedIngredientsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DetectedIngredients'>;
  route: RouteProp<RootStackParamList, 'DetectedIngredients'>;
};

const { width } = Dimensions.get('window');

export default function DetectedIngredientsScreen({ navigation, route }: DetectedIngredientsScreenProps) {
  const { state, dispatch } = useApp();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [detectedIngredients, setDetectedIngredients] = useState<DetectedIngredient[]>([]);
  const [personCount, setPersonCount] = useState(2);
  const { show, hide } = useLoading();
  const { imageBase64 } = route.params;

  useEffect(() => {
    processImage();
  }, []);

  const processImage = async () => {
    try {
      show('AI is analyzing your ingredients...');
      const detected = await detectIngredients(imageBase64);
      setDetectedIngredients(detected);
      
      // Auto-add detected ingredients to the list
      const ingredientNames = detected.map(ing => ing.name);
      setIngredients(ingredientNames);
      
      // Update global state
      dispatch({ type: ACTION_TYPES.SET_INGREDIENTS, payload: ingredientNames });
      dispatch({ type: ACTION_TYPES.SET_DETECTED_INGREDIENTS, payload: detected });
    } catch (error) {
      console.error('Error detecting ingredients:', error);
      Alert.alert('Detection Failed', 'Failed to detect ingredients. You can add them manually.');
    } finally {
      hide();
    }
  };

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

  const handleGenerateRecipe = async () => {
    if (!ingredients.length || !selectedCountry || !selectedMealType) {
      Alert.alert('Missing Information', 'Please ensure you have ingredients and have selected both cuisine type and meal type');
      return;
    }

    try {
      setLoading(true);
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
        Alert.alert('No Recipes', 'No recipes could be generated with these ingredients.');
      }
    } catch (error) {
      console.error('Error generating recipe:', error);
      Alert.alert('Generation Failed', 'Failed to generate recipes. Please try again.');
    } finally {
      setLoading(false);
      hide();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460'] as const}
          style={styles.backgroundGradient}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Generating your recipes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460'] as const}
          style={styles.backgroundGradient}
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>AI Detected Ingredients</Text>
            <Text style={styles.subtitle}>Review and add ingredients</Text>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          {/* Add Ingredient Input */}
          <View style={styles.inputSection}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={newIngredient}
                onChangeText={setNewIngredient}
                placeholder="Add ingredient..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                onSubmitEditing={handleAddIngredient}
                returnKeyType="done"
              />
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleAddIngredient}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
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
                      <Ionicons name="close" size={14} color="#FFFFFF" />
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
                <Ionicons name="remove" size={16} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.personCount}>{personCount}</Text>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setPersonCount(personCount + 1)}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Extra padding for bottom button */}
          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Generate Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity 
            style={[
              styles.generateButton,
              (!ingredients.length || !selectedCountry || !selectedMealType) && styles.disabledButton
            ]}
            onPress={handleGenerateRecipe}
            disabled={!ingredients.length || !selectedCountry || !selectedMealType}
          >
            <Ionicons 
              name="restaurant" 
              size={18} 
              color={(!ingredients.length || !selectedCountry || !selectedMealType) 
                ? "rgba(255, 255, 255, 0.3)" : "#FFFFFF"} 
            />
            <Text style={[
              styles.generateButtonText,
              (!ingredients.length || !selectedCountry || !selectedMealType) && styles.disabledButtonText
            ]}>
              Generate Recipes
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  inputSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    height: 40,
  },
  addButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  ingredientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  ingredientText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  removeButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  optionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  selectedOptionText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  personCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    minWidth: 24,
    textAlign: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#43e97b',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButtonText: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
}); 