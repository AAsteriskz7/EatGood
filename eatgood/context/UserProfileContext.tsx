'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DietPreference = 'any' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'halal' | 'kosher';
export type FitnessGoal = 'maintain' | 'lose_weight' | 'gain_muscle' | 'endurance';

export interface ScheduleEvent {
  id: string;
  title: string;
  time: string;       // ISO string or readable time
  type: 'flight' | 'broadcast' | 'meeting' | 'workout' | 'other';
  date: string;        // YYYY-MM-DD
}

export interface UserProfile {
  name: string;
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  dietPreference: DietPreference;
  fitnessGoal: FitnessGoal;
  allergies: string[];
  schedule: ScheduleEvent[];
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
  date: string;
  meals: MealEntry[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
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

export interface NearbyOption {
  venue: string;
  distance: string;
  recommendation: string;
  reason: string;
  estimatedCalories: number;
  estimatedProtein: number;
  type: 'good' | 'okay' | 'avoid';
}

export interface MicroIntervention {
  title: string;
  duration: string;
  description: string;
  type: 'movement' | 'breathing' | 'hydration' | 'rest';
}

export interface MealTimingAdvice {
  nextMealIn: string;
  mealType: string;
  reason: string;
}

export interface ProactiveSuggestions {
  nearbyOptions: NearbyOption[];
  microInterventions: MicroIntervention[];
  mealTimingAdvice: MealTimingAdvice | null;
  proactiveAlert: string;
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
  schedule: [],
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
  // Schedule
  addEvent: (event: Omit<ScheduleEvent, 'id'>) => void;
  removeEvent: (id: string) => void;
  todayEvents: ScheduleEvent[];
  // Location
  location: { latitude: number; longitude: number } | null;
  locationError: string | null;
  requestLocation: () => void;
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
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

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

  // Request geolocation on mount
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocationError(null);
      },
      (err) => {
        setLocationError(err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Auto-request location on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

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

  // Schedule management
  const addEvent = useCallback((event: Omit<ScheduleEvent, 'id'>) => {
    const newEvent: ScheduleEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };
    setProfile((prev) => ({
      ...prev,
      schedule: [...prev.schedule, newEvent],
    }));
  }, []);

  const removeEvent = useCallback((id: string) => {
    setProfile((prev) => ({
      ...prev,
      schedule: prev.schedule.filter((e) => e.id !== id),
    }));
  }, []);

  const todayEvents = profile.schedule
    .filter((e) => e.date === todayKey)
    .sort((a, b) => a.time.localeCompare(b.time));

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
    return null;
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
        addEvent,
        removeEvent,
        todayEvents,
        location,
        locationError,
        requestLocation,
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
