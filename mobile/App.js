import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  Alert,
  Platform,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const SERVER_URL = "https://famous-views-matter.loca.lt"; // replace with your Flask server URL

export default function App() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);

  const placeholderIngredients = useMemo(
    () => [
      {
        name: 'Grilled Chicken',
        weight: 189,
        calories: 312,
        protein: 58.7,
        carbs: 0,
        fat: 7.2,
        confidence: 92,
        color: '#22B8A6',
      },
      {
        name: 'Mixed Greens',
        weight: 31,
        calories: 8,
        protein: 0.6,
        carbs: 1.5,
        fat: 0.1,
        confidence: 88,
        color: '#16A34A',
      },
      {
        name: 'Cherry Tomato',
        weight: 33,
        calories: 6,
        protein: 0.3,
        carbs: 1.3,
        fat: 0.1,
        confidence: 86,
        color: '#EF4444',
      },
      {
        name: 'Croutons',
        weight: 10,
        calories: 47,
        protein: 1.2,
        carbs: 6.8,
        fat: 1.8,
        confidence: 71,
        color: '#F59E0B',
      },
    ],
    [],
  );

  const ingredientPalette = ['#22B8A6', '#16A34A', '#EF4444', '#F59E0B', '#6366F1', '#EC4899'];

  const ingredients = useMemo(() => {
    if (!result || !result.ingredients || !Array.isArray(result.ingredients)) {
      return placeholderIngredients;
    }

    return result.ingredients.map((ingredient, index) => {
      const normalizedConfidence =
        typeof ingredient.confidence === 'number'
          ? ingredient.confidence <= 1
            ? ingredient.confidence * 100
            : ingredient.confidence
          : null;
      const boundedConfidence =
        normalizedConfidence == null
          ? null
          : Math.round(Math.max(0, Math.min(100, normalizedConfidence)));

      return {
        name: ingredient.name || `Ingredient ${index + 1}`,
        weight: ingredient.weight_g ?? ingredient.weight ?? 0,
        calories: ingredient.calories_kcal ?? ingredient.calories ?? 0,
        protein: ingredient.protein_g ?? ingredient.protein ?? null,
        carbs: ingredient.carbs_g ?? ingredient.carbs ?? null,
        fat: ingredient.fat_g ?? ingredient.fat ?? null,
        confidence: boundedConfidence,
        color: ingredientPalette[index % ingredientPalette.length],
      };
    });
  }, [ingredientPalette, placeholderIngredients, result]);

  const totals = useMemo(
    () =>
      ingredients.reduce(
        (sum, ing) => ({
          calories: sum.calories + (ing.calories || 0),
          protein: sum.protein + (ing.protein || 0),
          carbs: sum.carbs + (ing.carbs || 0),
          fat: sum.fat + (ing.fat || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [ingredients],
  );

  const macroAvailability = useMemo(
    () => ({
      protein: ingredients.some((ingredient) => ingredient.protein != null),
      carbs: ingredients.some((ingredient) => ingredient.carbs != null),
      fat: ingredients.some((ingredient) => ingredient.fat != null),
    }),
    [ingredients],
  );

  const totalCaloriesDisplay = useMemo(() => {
    if (result && typeof result.total_calories === 'number') {
      return Math.round(result.total_calories);
    }

    return Math.round(totals.calories);
  }, [result, totals]);

  // Request camera permissions on app start
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            "Permission Required",
            "Camera access is required to take photos."
          );
        }
      }
    })();
  }, []);

 const takePhoto = async () => {
  try {
    let pickerResult = await ImagePicker.launchCameraAsync({
      quality: 1,
    });

    console.log("Picker Result:", pickerResult); // Debug

    if (!pickerResult.canceled) {
      const uri = pickerResult.assets[0].uri; // <-- updated
      setImage(uri);
      uploadPhoto(uri);
    } else {
      console.log("User cancelled the camera.");
    }
  } catch (error) {
    Alert.alert("Error", "Cannot open camera: " + error.message);
    console.log(error);
  }
};



  const uploadPhoto = async (uri) => {
    let formData = new FormData();
    let filename = uri.split('/').pop();
    let match = /\.(\w+)$/.exec(filename);
    let type = match ? `image/${match[1]}` : `image`;

    formData.append('photo', {
      uri,
      name: filename,
      type,
    });

    try {
      const response = await fetch(`${SERVER_URL}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      Alert.alert("Upload Failed", error.message);
      console.log(error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton}>
            <Feather name="chevron-left" size={24} color="#4B5563" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nutrition Breakdown</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.captureCard}>
            <View style={styles.captureInfo}>
              <Text style={styles.captureTitle}>Meal Photo</Text>
              <Text style={styles.captureSubtitle}>
                {image ? 'Retake to analyze another meal.' : 'Capture a photo to analyze nutrition.'}
              </Text>
              <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
                <Feather name="camera" size={16} color="#FFFFFF" />
                <Text style={styles.captureButtonText}>{image ? 'Retake Photo' : 'Take Photo'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.capturePreview}>
              {image ? (
                <Image source={{ uri: image }} style={styles.previewImage} />
              ) : (
                <View style={styles.previewPlaceholder}>
                  <Feather name="image" size={24} color="#A1A1AA" />
                </View>
              )}
            </View>
          </View>

          <View style={styles.totalsCard}>
            <Text style={styles.totalsLabel}>Total Nutrition</Text>
            <View style={styles.calorieRow}>
              <Text style={styles.calorieValue}>{totalCaloriesDisplay}</Text>
              <Text style={styles.calorieUnit}>kcal</Text>
            </View>
            <View style={styles.macrosRow}>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroValue}>
                  {macroAvailability.protein ? totals.protein.toFixed(1) : '—'}
                  <Text style={styles.macroUnit}>g</Text>
                </Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Carbs</Text>
                <Text style={styles.macroValue}>
                  {macroAvailability.carbs ? totals.carbs.toFixed(1) : '—'}
                  <Text style={styles.macroUnit}>g</Text>
                </Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Fat</Text>
                <Text style={styles.macroValue}>
                  {macroAvailability.fat ? totals.fat.toFixed(1) : '—'}
                  <Text style={styles.macroUnit}>g</Text>
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredient Breakdown</Text>
            <View style={styles.sectionSpacing}>
            {ingredients.map((ingredient, index) => (
              <View
                key={`${ingredient.name}-${index}`}
                style={[styles.ingredientCard, index !== 0 && styles.ingredientCardSpacing]}
              >
                  <View style={styles.ingredientHeader}>
                    <View style={styles.ingredientTitleRow}>
                      <View style={[styles.ingredientDot, { backgroundColor: ingredient.color }]} />
                      <Text style={styles.ingredientName}>{ingredient.name}</Text>
                      <Text style={styles.ingredientWeight}>({ingredient.weight || 0}g)</Text>
                    </View>
                    <Text style={styles.ingredientCalories}>{Math.round(ingredient.calories || 0)} kcal</Text>
                  </View>

                  <View style={styles.macroGrid}>
                    <View style={[styles.macroCard, styles.macroCardSpacing, { backgroundColor: '#EFF6FF' }]}>
                      <Text style={styles.macroCardLabel}>Protein</Text>
                      <Text style={styles.macroCardValue}>
                        {ingredient.protein != null ? ingredient.protein.toFixed(1) : '—'}g
                      </Text>
                    </View>
                    <View style={[styles.macroCard, styles.macroCardSpacing, { backgroundColor: '#FFF7ED' }]}>
                      <Text style={styles.macroCardLabel}>Carbs</Text>
                      <Text style={styles.macroCardValue}>
                        {ingredient.carbs != null ? ingredient.carbs.toFixed(1) : '—'}g
                      </Text>
                    </View>
                    <View style={[styles.macroCard, { backgroundColor: '#FEFCE8' }]}>
                      <Text style={styles.macroCardLabel}>Fat</Text>
                      <Text style={styles.macroCardValue}>
                        {ingredient.fat != null ? ingredient.fat.toFixed(1) : '—'}g
                      </Text>
                    </View>
                  </View>

                  <View style={styles.confidenceSection}>
                    <View style={styles.confidenceHeader}>
                      <Text style={styles.confidenceLabel}>Confidence</Text>
                      <Text style={styles.confidenceValue}>
                        {ingredient.confidence != null ? `${ingredient.confidence}%` : '—'}
                      </Text>
                    </View>
                    <View style={styles.confidenceTrack}>
                      <View
                        style={[
                          styles.confidenceFill,
                          {
                            width: `${ingredient.confidence != null ? ingredient.confidence : 0}%`,
                            backgroundColor: ingredient.color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <TouchableOpacity style={styles.addHiddenIngredientsButton}>
              <Feather name="plus" size={18} color="#4B5563" />
              <Text style={styles.addHiddenIngredientsText}>
                Add hidden ingredients (e.g., salt/oil)
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.inputLabel}>Serving Count</Text>
            <View style={styles.servingRow}>
              <TouchableOpacity style={[styles.servingAdjustButton, styles.servingAdjustLeft]}>
                <Text style={styles.servingAdjustText}>-</Text>
              </TouchableOpacity>
              <TextInput
                value="1"
                editable={false}
                style={[styles.servingInput, styles.servingInputSpacing]}
              />
              <TouchableOpacity style={[styles.servingAdjustButton, styles.servingIncreaseButton]}>
                <Text style={styles.servingIncreaseText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.inputLabel}>Tags</Text>
            <View style={styles.tagInputWrapper}>
              <Feather name="hash" size={14} color="#9CA3AF" style={styles.tagInputIcon} />
              <TextInput
                placeholder="Add tags (e.g., homemade, restaurant)"
                placeholderTextColor="#9CA3AF"
                style={styles.tagInput}
              />
            </View>
            <View style={styles.tagsRow}>
              <Text style={styles.tag}>healthy</Text>
              <Text style={styles.tag}>high-protein</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Values are calculated using food database and custom density tables. Tap ingredients to
              view detailed micronutrients.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.bottomAction}>
          <TouchableOpacity style={styles.bottomButton}>
            <Text style={styles.bottomButtonText}>Save Meal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAF9',
  },
  screen: {
    flex: 1,
    backgroundColor: '#F7FAF9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  scrollContent: {
    paddingBottom: 160,
  },
  captureCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  captureInfo: {
    flex: 1,
    justifyContent: 'space-between',
    marginRight: 16,
  },
  captureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  captureSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#22B8A6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  captureButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  capturePreview: {
    width: 96,
    height: 96,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalsCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#22B8A6',
  },
  totalsLabel: {
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
    fontSize: 14,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  calorieValue: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '700',
  },
  calorieUnit: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 20,
    marginBottom: 6,
    marginLeft: 8,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    flex: 1,
  },
  macroLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  macroValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  macroUnit: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  sectionSpacing: {},
  ingredientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ingredientCardSpacing: {
    marginTop: 12,
  },
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ingredientTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ingredientDot: {
    width: 10,
    height: 10,
    borderRadius: 6,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  ingredientWeight: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  ingredientCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  macroGrid: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  macroCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  macroCardSpacing: {
    marginRight: 10,
  },
  macroCardLabel: {
    fontSize: 11,
    color: '#4B5563',
    marginBottom: 4,
  },
  macroCardValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  confidenceSection: {
    marginTop: 4,
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  confidenceLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  confidenceValue: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  confidenceTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 999,
  },
  addHiddenIngredientsButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addHiddenIngredientsText: {
    fontSize: 13,
    color: '#4B5563',
    marginLeft: 8,
  },
  inputLabel: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 10,
  },
  servingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servingAdjustButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingAdjustLeft: {
    marginRight: 12,
  },
  servingAdjustText: {
    fontSize: 20,
    color: '#4B5563',
    fontWeight: '500',
  },
  servingIncreaseButton: {
    backgroundColor: '#22B8A6',
    borderColor: '#22B8A6',
  },
  servingIncreaseText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  servingInput: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    textAlign: 'center',
    fontSize: 16,
    color: '#111827',
  },
  servingInputSpacing: {
    marginRight: 12,
  },
  tagInputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  tagInputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  tagInput: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingLeft: 40,
    paddingRight: 16,
    fontSize: 14,
    color: '#111827',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#E8F5F3',
    color: '#22B8A6',
    fontSize: 12,
    fontWeight: '500',
    marginRight: 8,
    marginBottom: 8,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#1D4ED8',
    lineHeight: 20,
  },
  bottomAction: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 16,
  },
  bottomButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#22B8A6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
