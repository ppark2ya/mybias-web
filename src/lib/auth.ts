import { supabase } from "./supabase";
import type { Profile, UserSettings } from "../types/database";

/**
 * Auth utility functions for Supabase authentication
 */

/**
 * Get the current user's profile
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data as Profile | null;
}

/**
 * Update the current user's profile
 */
export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, "email" | "full_name" | "avatar_url">>
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    return null;
  }

  return data as Profile | null;
}

/**
 * Get user settings
 */
export async function getUserSettings(
  userId: string
): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    // If no settings exist, create default settings
    if (error.code === "PGRST116") {
      return createUserSettings(userId);
    }
    console.error("Error fetching user settings:", error);
    return null;
  }

  return data as UserSettings | null;
}

/**
 * Create default user settings
 */
export async function createUserSettings(
  userId: string
): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from("user_settings")
    .insert({
      user_id: userId,
      daily_ai_usage: 0,
      last_usage_reset: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating user settings:", error);
    return null;
  }

  return data as UserSettings | null;
}

/**
 * Increment AI usage count
 */
export async function incrementAiUsage(userId: string): Promise<boolean> {
  const settings = await getUserSettings(userId);
  if (!settings) return false;

  // Check if we need to reset the daily counter
  const lastReset = new Date(settings.last_usage_reset);
  const now = new Date();
  const isNewDay = lastReset.toDateString() !== now.toDateString();

  const newUsage = isNewDay ? 1 : settings.daily_ai_usage + 1;

  const { error } = await supabase
    .from("user_settings")
    .update({
      daily_ai_usage: newUsage,
      last_usage_reset: isNewDay ? now.toISOString() : settings.last_usage_reset,
      updated_at: now.toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Error incrementing AI usage:", error);
    return false;
  }

  return true;
}

/**
 * Get remaining AI usage for today
 */
export async function getRemainingAiUsage(
  userId: string,
  dailyLimit: number = 5
): Promise<number> {
  const settings = await getUserSettings(userId);
  if (!settings) return dailyLimit;

  // Check if we need to reset the daily counter
  const lastReset = new Date(settings.last_usage_reset);
  const now = new Date();
  const isNewDay = lastReset.toDateString() !== now.toDateString();

  if (isNewDay) {
    return dailyLimit;
  }

  return Math.max(0, dailyLimit - settings.daily_ai_usage);
}

/**
 * Check if user can use AI enhancement
 */
export async function canUseAiEnhancement(
  userId: string,
  dailyLimit: number = 5
): Promise<boolean> {
  const remaining = await getRemainingAiUsage(userId, dailyLimit);
  return remaining > 0;
}
