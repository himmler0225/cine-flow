const SECOND = 1_000;
const MINUTE = 60 * SECOND;

export const CACHE_TTL = {
  minute: MINUTE,
  twoMinutes: 2 * MINUTE,
  threeMinutes: 3 * MINUTE,
  fiveMinutes: 5 * MINUTE,
  tenMinutes: 10 * MINUTE,
  fifteenMinutes: 15 * MINUTE,
  thirtyMinutes: 30 * MINUTE,
  hour: 60 * MINUTE,
  sixHours: 6 * 60 * MINUTE,
  day: 24 * 60 * MINUTE,
} as const;

export const UI_DELAY_MS = {
  navbarOpen: 120,
  navbarClose: 150,
  deferredRowWork: 200,
  debounceDefault: 300,
  searchDebounce: 350,
  countdownTick: SECOND,
  chatFloat: 1_800,
  copyFeedback: 2_000,
  reaction: 2_800,
  heroSlide: 12_000,
} as const;

export const QUERY_RETRY = {
  attempts: 2,
  baseDelayMs: SECOND,
  maxDelayMs: 8 * SECOND,
} as const;
