const SECOND = 1000;

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
  chatFloat: 1800,
  copyFeedback: 2000,
  reaction: 2800,
  heroSlide: 12000,
  playerControlsHide: 3000,
  doubleTap: 280,
  seekFlash: 650,
} as const;

/** Step for the ±10s buttons, double-tap and ←/→ keys. */
export const PLAYER_SEEK_STEP_SEC = 10;

export const QUERY_RETRY = {
  attempts: 2,
  baseDelayMs: SECOND,
  maxDelayMs: 8 * SECOND,
} as const;

export const MOVIE_API_TIMEOUT_MS = 30 * SECOND;

export const AUTO_ADVANCE_SECONDS = 5;

export const WATCH_PARTY_MS = {
  syncTick: 3 * SECOND,
  reactionTtl: 3 * SECOND,
} as const;
