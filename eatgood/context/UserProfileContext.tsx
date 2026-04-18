'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DietPreference = 'any' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'halal' | 'kosher';
export type FitnessGoal = 'maintain' | 'lose_weight' | 'gain_muscle' | 'endurance' | 'heart_health' | 'low_sodium';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Sex = 'male' | 'female' | 'other';

export interface ScheduleEvent {
  id: string;
  title: string;
  time: string;
  type: 'flight' | 'broadcast' | 'meeting' | 'workout' | 'other';
  date: string; // YYYY-MM-DD
}

export interface UserProfile {
  name: string;
  // Physical stats
  age: number | null;
  sex: Sex | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: ActivityLevel;
  // Targets (auto-calculated or overridden)
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  targetsAutoCalculated: boolean;
  // Preferences
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

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  weightKg: number;
}

export interface SavedRestaurant {
  id: string;
  name: string;
  lat: number;
  lon: number;
  recommendation: string;
  reason: string;
  savedAt: number;
}

export interface SavedMeal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  recommendation: 'good' | 'okay' | 'avoid';
  savedAt: number;
}

// ─── Calculation Helpers ──────────────────────────────────────────────────────

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calcBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function getBMICategory(bmi: number): { label: string; token: string } {
  if (bmi < 18.5) return { label: 'Underweight', token: 'text-feedback-info' };
  if (bmi < 25)   return { label: 'Healthy', token: 'text-primary' };
  if (bmi < 30)   return { label: 'Overweight', token: 'text-feedback-warning' };
  return { label: 'Obese', token: 'text-destructive' };
}

export function calcTDEE(profile: Pick<UserProfile, 'age' | 'sex' | 'heightCm' | 'weightKg' | 'activityLevel'>): number | null {
  const { age, sex, heightCm, weightKg, activityLevel } = profile;
  if (!age || !heightCm || !weightKg || !sex) return null;
  let bmr: number;
  if (sex === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else if (sex === 'female') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  } else {
    const male = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    const female = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    bmr = (male + female) / 2;
  }
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

const MACRO_SPLITS: Record<FitnessGoal, { protein: number; carbs: number; fat: number }> = {
  lose_weight:  { protein: 0.30, carbs: 0.40, fat: 0.30 },
  gain_muscle:  { protein: 0.35, carbs: 0.45, fat: 0.20 },
  maintain:     { protein: 0.25, carbs: 0.50, fat: 0.25 },
  endurance:    { protein: 0.20, carbs: 0.55, fat: 0.25 },
  heart_health: { protein: 0.20, carbs: 0.50, fat: 0.30 },
  low_sodium:   { protein: 0.25, carbs: 0.50, fat: 0.25 },
};

export function calcMacros(tdee: number, goal: FitnessGoal): { calories: number; proteinG: number; carbsG: number; fatG: number } {
  const split = MACRO_SPLITS[goal];
  // Adjust TDEE for goal
  let targetCalories = tdee;
  if (goal === 'lose_weight') targetCalories = Math.round(tdee * 0.85);
  if (goal === 'gain_muscle') targetCalories = Math.round(tdee * 1.10);

  return {
    calories: targetCalories,
    proteinG: Math.round((targetCalories * split.protein) / 4),
    carbsG: Math.round((targetCalories * split.carbs) / 4),
    fatG: Math.round((targetCalories * split.fat) / 9),
  };
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  age: null,
  sex: null,
  heightCm: null,
  weightKg: null,
  activityLevel: 'moderate',
  calorieTarget: 2000,
  proteinTarget: 150,
  carbTarget: 200,
  fatTarget: 65,
  targetsAutoCalculated: false,
  dietPreference: 'any',
  fitnessGoal: 'maintain',
  allergies: [],
  schedule: [],
  setupComplete: false,
};

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Context Shape ─────────────────────────────────────────────────────────────

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
  // Weight log
  weightLog: WeightEntry[];
  logWeight: (weightKg: number) => void;
  // Saved
  savedRestaurants: SavedRestaurant[];
  savedMeals: SavedMeal[];
  saveRestaurant: (r: Omit<SavedRestaurant, 'id' | 'savedAt'>) => void;
  unsaveRestaurant: (id: string) => void;
  saveMeal: (m: Omit<SavedMeal, 'id' | 'savedAt'>) => void;
  unsaveMeal: (id: string) => void;
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

// ─── Provider ─────────────────────────────────────────────────────────────────

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [mealsByDate, setMealsByDate] = useState<Record<string, MealEntry[]>>({});
  const [weightLog, setWeightLog] = useState<WeightEntry[]>([]);
  const [savedRestaurants, setSavedRestaurants] = useState<SavedRestaurant[]>([]);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    setProfile(loadFromStorage('anchorfuel_profile', DEFAULT_PROFILE));
    setMealsByDate(loadFromStorage('anchorfuel_meals', {}));
    setWeightLog(loadFromStorage('anchorfuel_weight', []));
    setSavedRestaurants(loadFromStorage('anchorfuel_saved_restaurants', []));
    setSavedMeals(loadFromStorage('anchorfuel_saved_meals', []));
    setHydrated(true);
  }, []);

  useEffect(() => { if (hydrated) saveToStorage('anchorfuel_profile', profile); }, [profile, hydrated]);
  useEffect(() => { if (hydrated) saveToStorage('anchorfuel_meals', mealsByDate); }, [mealsByDate, hydrated]);
  useEffect(() => { if (hydrated) saveToStorage('anchorfuel_weight', weightLog); }, [weightLog, hydrated]);
  useEffect(() => { if (hydrated) saveToStorage('anchorfuel_saved_restaurants', savedRestaurants); }, [savedRestaurants, hydrated]);
  useEffect(() => { if (hydrated) saveToStorage('anchorfuel_saved_meals', savedMeals); }, [savedMeals, hydrated]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocationError('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }); setLocationError(null); },
      (err) => { setLocationError(err.message); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => { requestLocation(); }, [requestLocation]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  const todayKey = getTodayKey();
  const todayMeals = mealsByDate[todayKey] ?? [];
  const totalCalories = todayMeals.reduce((s, m) => s + m.calories, 0);
  const totalProtein  = todayMeals.reduce((s, m) => s + m.protein, 0);
  const totalCarbs    = todayMeals.reduce((s, m) => s + m.carbs, 0);
  const totalFat      = todayMeals.reduce((s, m) => s + m.fat, 0);

  const todayLog: DailyLog = { date: todayKey, meals: todayMeals, totalCalories, totalProtein, totalCarbs, totalFat };

  const addMeal = useCallback((meal: Omit<MealEntry, 'id' | 'timestamp'>) => {
    const entry: MealEntry = {
      ...meal,
      id: `meal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    };
    setMealsByDate((prev) => {
      const key = getTodayKey();
      return { ...prev, [key]: [...(prev[key] ?? []), entry] };
    });
  }, []);

  const removeMeal = useCallback((id: string) => {
    setMealsByDate((prev) => {
      const key = getTodayKey();
      return { ...prev, [key]: (prev[key] ?? []).filter((m) => m.id !== id) };
    });
  }, []);

  const addEvent = useCallback((event: Omit<ScheduleEvent, 'id'>) => {
    const newEvent: ScheduleEvent = { ...event, id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` };
    setProfile((prev) => ({ ...prev, schedule: [...prev.schedule, newEvent] }));
  }, []);

  const removeEvent = useCallback((id: string) => {
    setProfile((prev) => ({ ...prev, schedule: prev.schedule.filter((e) => e.id !== id) }));
  }, []);

  const todayEvents = profile.schedule
    .filter((e) => e.date === todayKey)
    .sort((a, b) => a.time.localeCompare(b.time));

  const weekHistory: DailyLog[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const meals = mealsByDate[key] ?? [];
    weekHistory.push({
      date: key, meals,
      totalCalories: meals.reduce((s, m) => s + m.calories, 0),
      totalProtein:  meals.reduce((s, m) => s + m.protein, 0),
      totalCarbs:    meals.reduce((s, m) => s + m.carbs, 0),
      totalFat:      meals.reduce((s, m) => s + m.fat, 0),
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

  const logWeight = useCallback((kg: number) => {
    const entry: WeightEntry = { date: getTodayKey(), weightKg: kg };
    setWeightLog((prev) => {
      const filtered = prev.filter((w) => w.date !== entry.date);
      return [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date));
    });
    // Keep weightKg on profile in sync
    setProfile((prev) => ({ ...prev, weightKg: kg }));
  }, []);

  const saveRestaurant = useCallback((r: Omit<SavedRestaurant, 'id' | 'savedAt'>) => {
    const entry: SavedRestaurant = { ...r, id: `rst_${Date.now()}`, savedAt: Date.now() };
    setSavedRestaurants((prev) => [...prev.filter((x) => x.name !== r.name), entry]);
  }, []);

  const unsaveRestaurant = useCallback((id: string) => {
    setSavedRestaurants((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const saveMeal = useCallback((m: Omit<SavedMeal, 'id' | 'savedAt'>) => {
    const entry: SavedMeal = { ...m, id: `sml_${Date.now()}`, savedAt: Date.now() };
    setSavedMeals((prev) => [...prev.filter((x) => x.name !== m.name), entry]);
  }, []);

  const unsaveMeal = useCallback((id: string) => {
    setSavedMeals((prev) => prev.filter((m) => m.id !== id));
  }, []);

  if (!hydrated) return null;

  return (
    <UserProfileContext.Provider
      value={{
        profile, updateProfile,
        todayLog, addMeal, removeMeal,
        weekHistory,
        remainingCalories, remainingProtein, remainingCarbs, remainingFat,
        calorieProgress, proteinProgress, carbProgress, fatProgress,
        addEvent, removeEvent, todayEvents,
        location, locationError, requestLocation,
        weightLog, logWeight,
        savedRestaurants, savedMeals,
        saveRestaurant, unsaveRestaurant, saveMeal, unsaveMeal,
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
