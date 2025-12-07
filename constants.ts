export const APP_STORAGE_KEY = 'pixel-nutrition-ai-data';

export const MOCK_LOADING_PHRASES = [
  "Consulting the nutrition almanac...",
  "Weighing the digital ingredients...",
  "Calculating macro profile...",
  "Analyzing food composition...",
];

// NHS / UK Government recommendations for an average adult male
// Calories: 2500kcal
// Protein: 55g (RNI)
// Carbs: ~50% energy (~310g)
// Fat: ~35% energy (~95g)
// Fiber: 30g
export const UK_ADULT_MALE_TARGETS = {
  calories: 2500,
  protein: 55,
  carbs: 310,
  fat: 95,
  fiber: 30
};