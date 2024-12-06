export const CACHE_KEYS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  INGREDIENTS: 'ingredients',
  MENUS: 'menus',
  DB_STATS: 'db:stats',
} as const;

export const CACHE_DURATIONS = {
  PRODUCTS: 7200,
  CATEGORIES: 21600,
  INGREDIENTS: 7200,
  MENUS: 7200,
  DB_STATS: 300,
} as const;
