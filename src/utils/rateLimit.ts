const STORAGE_KEY = "mybias_ai_usage";
const DAILY_LIMIT = 3;

interface UsageData {
  count: number;
  date: string; // YYYY-MM-DD format
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Get current usage data from localStorage
 */
function getUsageData(): UsageData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data: UsageData = JSON.parse(stored);
      // Reset if it's a new day
      if (data.date !== getTodayDate()) {
        return { count: 0, date: getTodayDate() };
      }
      return data;
    }
  } catch {
    // Ignore parse errors
  }
  return { count: 0, date: getTodayDate() };
}

/**
 * Save usage data to localStorage
 */
function saveUsageData(data: UsageData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get remaining AI usage count for today
 */
export function getRemainingAIUsage(): number {
  const data = getUsageData();
  return Math.max(0, DAILY_LIMIT - data.count);
}

/**
 * Check if user can use AI feature
 */
export function canUseAI(): boolean {
  return getRemainingAIUsage() > 0;
}

/**
 * Increment AI usage count
 * Returns the new remaining count
 */
export function incrementAIUsage(): number {
  const data = getUsageData();
  data.count += 1;
  saveUsageData(data);
  return Math.max(0, DAILY_LIMIT - data.count);
}

/**
 * Get daily limit
 */
export function getDailyLimit(): number {
  return DAILY_LIMIT;
}
