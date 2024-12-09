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
  STATIONS: 3600,
  DB_STATS: 300,
} as const;

export const REDIS_KEY_PATTERNS = {
  PRODUCT: {
    DETAIL: 'product:detail:{id}',
    LIST: 'product:list:{queryHash}',
    EXISTS: 'product:exists:{queryHash}',
  },
  CATEGORY: {
    DETAIL: 'category:detail:{id}',
    LIST: 'category:list:{queryHash}',
    EXISTS: 'category:exists:{queryHash}',
    TREE: 'category:tree',
  },
  INGREDIENT: {
    DETAIL: 'ingredient:detail:{id}',
    LIST: 'ingredient:list:{queryHash}',
  },
  SUPPLIER: {
    DETAIL: 'supplier:detail:{id}',
    LIST: 'supplier:list:{queryHash}',
  },
  STATION: {
    DETAIL: 'station:detail:{id}',
    LIST: 'station:list:{queryHash}',
  },
} as const;
