export const ALLERGENS_LIST = ['Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Wheat', 'Gluten', 'Soy', 'Fish', 'Shellfish', 'Sesame', 'Mustard', 'Celery', 'Lupin', 'Sulfites', 'Corn', 'Meat', 'Poultry', 'Pork', 'Beef', 'Gelatin', 'Artificial Colors', 'MSG', 'Yeast', 'Garlic', 'Onion'];

export const DEMO_RESPONSE = { dishes: [
  { name: 'Spicy Thai Peanut Curry', detected_allergens: ['Peanuts'], hidden_risks: ['Cross-contamination in wok', 'Fish sauce (shellfish risk)'], overall_risk: 'red' },
  { name: 'Grilled Chicken Salad', detected_allergens: [], hidden_risks: ['Check salad dressing for dairy'], overall_risk: 'yellow' },
  { name: 'Steamed White Rice', detected_allergens: [], hidden_risks: [], overall_risk: 'green' }
] };

export const DEFAULT_PROFILE = { name: '', allergens: [], contacts: [{ name: '', phone: '', relation: '' }] };
