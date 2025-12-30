/**
 * Time constants in milliseconds
 * All values are derived from MILLISECOND for consistency
 */

export const MILLISECOND = 1;
export const SECOND = MILLISECOND * 1000;
export const MINUTE = SECOND * 60;
export const HOUR = MINUTE * 60;
export const DAY = HOUR * 24;
export const WEEK = DAY * 7;
export const MONTH = DAY * 30; // Approximate
export const YEAR = DAY * 365; // Approximate

/**
 * Common timeout presets
 */
export const TIMEOUTS = {
  /** Short timeout for quick operations (5 seconds) */
  SHORT: SECOND * 5,
  /** Default timeout for API calls (30 seconds) */
  DEFAULT: SECOND * 30,
  /** Long timeout for heavy operations like AI processing (2 minutes) */
  LONG: MINUTE * 2,
  /** Extended timeout for very long operations (5 minutes) */
  EXTENDED: MINUTE * 5,
} as const;

/**
 * Polling intervals
 */
export const POLLING = {
  /** Fast polling interval (1 second) */
  FAST: SECOND,
  /** Default polling interval (3 seconds) */
  DEFAULT: SECOND * 3,
  /** Slow polling interval (10 seconds) */
  SLOW: SECOND * 10,
} as const;

/**
 * Cache durations
 */
export const CACHE = {
  /** Short cache duration (1 minute) */
  SHORT: MINUTE,
  /** Default cache duration (5 minutes) */
  DEFAULT: MINUTE * 5,
  /** Long cache duration (1 hour) */
  LONG: HOUR,
  /** Stale time for react-query (30 seconds) */
  STALE_TIME: SECOND * 30,
} as const;
