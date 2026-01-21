/**
 * Generate 5-6 item suggestions based on cart contents
 * @param {Array} cartItems - Current items in cart
 * @param {Array} allMenuItems - All available menu items
 * @returns {Array} - 5-6 suggested items
 */

// Fisher-Yates shuffle algorithm for unbiased shuffling
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const getSuggestions = (cartItems, allMenuItems) => {
  if (!Array.isArray(allMenuItems) || allMenuItems.length === 0) {
    return [];
  }

  // Extract item IDs already in cart
  const cartItemIds = new Set(
    (cartItems || []).map(item => String(item._id || item.id))
  );

  // Filter out items already in cart
  const availableItems = allMenuItems.filter(
    item => !cartItemIds.has(String(item._id || item.id))
  );

  if (availableItems.length === 0) {
    return [];
  }

  // Extract categories from cart items
  const cartCategories = new Set(
    (cartItems || [])
      .map(item => (item.category || '').toLowerCase())
      .filter(Boolean)
  );

  // Categorize available items
  const itemsByCategory = {};
  availableItems.forEach(item => {
    const category = (item.category || 'other').toLowerCase();
    if (!itemsByCategory[category]) {
      itemsByCategory[category] = [];
    }
    itemsByCategory[category].push(item);
  });

  // Strategy: Prioritize items from different categories than what's in cart
  const suggestions = [];
  const targetCount = 6;

  // First, try to get items from categories NOT in cart
  const otherCategories = Object.keys(itemsByCategory).filter(
    cat => !cartCategories.has(cat)
  );

  if (otherCategories.length > 0) {
    // Shuffle categories to add randomness
    const shuffledCategories = shuffleArray(otherCategories);
    
    for (const category of shuffledCategories) {
      if (suggestions.length >= targetCount) break;
      
      const categoryItems = itemsByCategory[category];
      // Pick a random item from this category
      const randomItem = categoryItems[Math.floor(Math.random() * categoryItems.length)];
      suggestions.push(randomItem);
    }
  }

  // If we still need more suggestions, add items from any remaining categories
  if (suggestions.length < targetCount) {
    const remainingItems = availableItems.filter(
      item => !suggestions.find(s => s._id === item._id)
    );
    
    // Shuffle and take what we need
    const shuffled = shuffleArray(remainingItems);
    const needed = targetCount - suggestions.length;
    suggestions.push(...shuffled.slice(0, needed));
  }

  // Final shuffle of suggestions to add variety
  return shuffleArray(suggestions).slice(0, targetCount);
};
