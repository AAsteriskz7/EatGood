'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DietPreference = 'any' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'halal' | 'kosher';
export type FitnessGoal = 'maintain' | 'lose_weight' | 'gain_muscle' | 'endurance';

export interface UserProfile {
  name: string;
  calorieTarget: number;
  proteinTarget: number;  // grams
  carbTarget: number;     // grams
  fatTarget: number;      // grams
  dietPreference: DietPreference;
  fitnessGoal: FitnessGoal;
  allergies: string[];
  setupComplete: boolean;
}

export interface MealEntry {
  id: string;
  timestamp: number;
  imageDataUrl?: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  recommendation: 'good' | 'okay' | 'avoid';
  aiAdvice: string;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  meals: MealEntry[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface ScanResult {
  loading: boolean;
  items: FoodItem[];
  recipe?: RecipeResult;
  error?: string;
}

export interface FoodItem {
  name: string;
  recommendation: 'good' | 'okay' | 'avoid';
  reason: string;
  estimatedCalories: number;
  estimatedProtein: number;
  estimatedCarbs: number;
  estimatedFat: number;
}

export interface RecipeResult {
  name: string;
  cookTime: string;
  ingredients: string[];
  steps: string[];
  estimatedCalories: number;
  estimatedProtein: number;
  estimatedCarbs: number;
  estimatedFat: number;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  calorieTarget: 2000,
  proteinTarget: 150,
  carbTarget: 200,
  fatTarget: 65,
  dietPreference: 'any',
  fitnessGoal: 'maintain',
  allergies: [],
  setupComplete: false,
};

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface UserProfileContextValue {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  todayLog: DailyLog;
  addMeal: (meal: Omit<MealEntry, 'id' | 'timestamp'>) => void;
  removeMeal: (id: string) => void;
  weekHistory: DailyLog[];
  remainingCalories: number;
  remainingProtein: number;
  remainingCarbs: number;
  remainingFat: number;
  calorieProgress: number;
  proteinProgress: number;
  carbProgress: number;
  fatProgress: number;
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota exceeded — silent fail */ }
}

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [mealsByDate, setMealsByDate] = useState<Record<string, MealEntry[]>>({});
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setProfile(loadFromStorage('anchorfuel_profile', DEFAULT_PROFILE));
    setMealsByDate(loadFromStorage('anchorfuel_meals', {}));
    setHydrated(true);
  }, []);

  // Persist on change
  useEffect(() => {
    if (!hydrated) return;
    saveToStorage('anchorfuel_profile', profile);
  }, [profile, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveToStorage('anchorfuel_meals', mealsByDate);
  }, [mealsByDate, hydrated]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  const todayKey = getTodayKey();
  const todayMeals = mealsByDate[todayKey] ?? [];
  const totalCalories = todayMeals.reduce((s, m) => s + m.calories, 0);
  const totalProtein  = todayMeals.reduce((s, m) => s + m.protein, 0);
  const totalCarbs    = todayMeals.reduce((s, m) => s + m.carbs, 0);
  const totalFat      = todayMeals.reduce((s, m) => s + m.fat, 0);

  const todayLog: DailyLog = {
    date: todayKey,
    meals: todayMeals,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
  };

  const addMeal = useCallback((meal: Omit<MealEntry, 'id' | 'timestamp'>) => {
    const entry: MealEntry = {
      ...meal,
      id: `meal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    };
    setMealsByDate((prev) => {
      const key = getTodayKey();
      const existing = prev[key] ?? [];
      return { ...prev, [key]: [...existing, entry] };
    });
  }, []);

  const removeMeal = useCallback((id: string) => {
    setMealsByDate((prev) => {
      const key = getTodayKey();
      const existing = prev[key] ?? [];
      return { ...prev, [key]: existing.filter((m) => m.id !== id) };
    });
  }, []);

  // Build last 7 days history
  const weekHistory: DailyLog[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const meals = mealsByDate[key] ?? [];
    weekHistory.push({
      date: key,
      meals,
      totalCalories: meals.reduce((s, m) => s + m.calories, 0),
      totalProtein: meals.reduce((s, m) => s + m.protein, 0),
      totalCarbs: meals.reduce((s, m) => s + m.carbs, 0),
      totalFat: meals.reduce((s, m) => s + m.fat, 0),
    });
  }

  const remainingCalories = Math.max(0, profile.calorieTarget - totalCalories);
  const remainingProtein  = Math.max(0, profile.proteinTarget - totalProtein);
  const remainingCarbs    = Math.max(0, profile.carbTarget - totalCarbs);
  const remainingFat      = Math.max(0, profile.fatTarget - totalFat);

  const calorieProgress = Math.min((totalCalories / profile.calorieTarget) * 100, 100);
  const proteinProgress = Math.min((totalProtein / profile.proteinTarget) * 100, 100);
  const carbProgress    = Math.min((totalCarbs / profile.carbTarget) * 100, 100);
  const fatProgress     = Math.min((totalFat / profile.fatTarget) * 100, 100);

  if (!hydrated) {
    return null; // Don't render until hydrated to prevent flash
  }

  return (
    <UserProfileContext.Provider
      value={{
        profile,
        updateProfile,
        todayLog,
        addMeal,
        removeMeal,
        weekHistory,
        remainingCalories,
        remainingProtein,
        remainingCarbs,
        remainingFat,
        calorieProgress,
        proteinProgress,
        carbProgress,
        fatProgress,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error('useUserProfile must be used within UserProfileProvider');
  return ctx;
}
