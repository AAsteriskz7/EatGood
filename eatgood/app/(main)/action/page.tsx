'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useUserProfile } from '@/context/UserProfileContext';
import type { FoodItem, RecipeResult } from '@/context/UserProfileContext';
import {
  Camera, SwitchCamera, X, ChefHat, UtensilsCrossed,
  Check, AlertTriangle, Minus, Loader2, ImagePlus,
  Bookmark, BookmarkCheck, ArrowRight, RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

type ScanMode = 'menu' | 'fridge';

interface SwapSuggestion {
  name: string;
  reason: string;
  estimatedCalories: number;
  estimatedProtein: number;
}

const RECO_STYLE: Record<string, { bg: string; text: string; border: string; icon: React.ElementType }> = {
  good:  { bg: 'bg-primary/10',          text: 'text-primary',          border: 'border-primary/20',          icon: Check },
  okay:  { bg: 'bg-feedback-warning/10', text: 'text-feedback-warning', border: 'border-feedback-warning/20', icon: Minus },
  avoid: { bg: 'bg-destructive/10',      text: 'text-destructive',      border: 'border-destructive/20',      icon: AlertTriangle },
};

const GOAL_LABELS: Record<string, string> = {
  lose_weight:  'Fat Loss',
  gain_muscle:  'Muscle Gain',
  maintain:     'Maintain',
  endurance:    'Endurance',
  heart_health: 'Heart Health',
  low_sodium:   'Low Sodium',
};

function formatKcal(n: number) {
  if (!Number.isFinite(n)) return '—';
  return Math.round(n).toLocaleString();
}

function formatMacroGrams(n: number) {
  if (!Number.isFinite(n)) return '—';
  const x = Math.round(n * 10) / 10;
  return Number.isInteger(x) ? String(x) : x.toFixed(1);
}

/** Compact tabular macro row for scan results */
function MacroStrip({
  calories,
  protein,
  carbs,
  fat,
  compact,
  variant = 'full',
  className,
}: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  compact?: boolean;
  variant?: 'full' | 'caloriesProtein';
  className?: string;
}) {
  const cells =
    variant === 'caloriesProtein'
      ? [
          { label: 'Cal', value: formatKcal(calories), unit: 'kcal' },
          { label: 'Protein', value: formatMacroGrams(protein), unit: 'g' },
        ]
      : [
          { label: 'Cal', value: formatKcal(calories), unit: 'kcal' },
          { label: 'P', value: formatMacroGrams(protein), unit: 'g' },
          { label: 'C', value: formatMacroGrams(carbs), unit: 'g' },
          { label: 'F', value: formatMacroGrams(fat), unit: 'g' },
        ];
  const gridCols = variant === 'caloriesProtein' ? 'grid-cols-2' : 'grid-cols-4';
  return (
    <div
      className={[
        'grid rounded-lg border border-border bg-muted/30',
        gridCols,
        compact ? 'gap-0.5 p-2' : 'gap-1 p-3',
      ].join(' ')}
    >
      {cells.map((c) => (
        <div key={c.label} className="text-center min-w-0">
          <p className="type-micro text-muted-foreground leading-none mb-1">{c.label}</p>
          <p className={['tabular-nums text-foreground font-semibold leading-tight', compact ? 'type-micro' : 'type-label'].join(' ')}>
            {c.value}
            {c.unit ? <span className="type-micro text-muted-foreground font-medium ml-0.5">{c.unit}</span> : null}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Snack Swap Card ──────────────────────────────────────────────────────────

function SnackSwapCard({
  foodName, userProfile,
  onDismiss, onLogSwap,
}: {
  foodName: string;
  userProfile: Record<string, unknown>;
  onDismiss: () => void;
  onLogSwap: (swap: SwapSuggestion) => void;
}) {
  const [swaps, setSwaps] = useState<SwapSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/snack-swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foodName, userProfile }),
    })
      .then((r) => r.json())
      .then((data) => { setSwaps(data.swaps ?? []); setLoading(false); })
      .catch(() => { setError('Could not load alternatives'); setLoading(false); });
  }, [foodName]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Card className="border-primary/20 animate-fade-up">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="type-label text-foreground font-semibold">Healthier alternatives</p>
          <button
            onClick={onDismiss}
            aria-label="Dismiss swap suggestions"
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <X size={14} strokeWidth={2} className="text-muted-foreground" />
          </button>
        </div>
        {loading && (
          <div className="flex items-center gap-2 py-2">
            <Loader2 size={14} className="animate-spin text-primary" />
            <span className="type-caption text-muted-foreground">Finding alternatives...</span>
          </div>
        )}
        {error && <p className="type-caption text-destructive">{error}</p>}
        {swaps.map((swap, i) => (
          <div key={i} className="border-t border-border pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="type-label text-foreground">{swap.name}</p>
                <p className="type-caption text-muted-foreground mt-0.5 line-clamp-2">{swap.reason}</p>
                <div className="mt-2 max-w-[200px]">
                  <MacroStrip
                    calories={swap.estimatedCalories}
                    protein={swap.estimatedProtein}
                    carbs={0}
                    fat={0}
                    compact
                    variant="caloriesProtein"
                  />
                </div>
              </div>
              <button
                onClick={() => onLogSwap(swap)}
                aria-label={`Log ${swap.name} instead`}
                className="flex items-center gap-1 type-micro text-primary font-semibold flex-shrink-0 active:opacity-70 transition-opacity"
              >
                Log <ArrowRight size={12} strokeWidth={2} />
              </button>
            </div>
          </div>
        ))}
        {!loading && swaps.length === 0 && !error && (
          <p className="type-caption text-muted-foreground">No alternatives found.</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ActionPage() {
  const {
    profile, remainingCalories, remainingProtein, remainingCarbs, remainingFat,
    addMeal, savedMeals, saveMeal, unsaveMeal,
  } = useUserProfile();

  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [mode, setMode] = useState<ScanMode>('menu');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [recipe, setRecipe] = useState<RecipeResult | null>(null);
  const [loggedItems, setLoggedItems] = useState<Set<string>>(new Set());
  const [swapTarget, setSwapTarget] = useState<string | null>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) { setCapturedImage(imageSrc); analyzeImage(imageSrc); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCapturedImage(dataUrl);
      analyzeImage(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const analyzeImage = async (imageBase64: string) => {
    setLoading(true);
    setError(null);
    setFoodItems([]);
    setRecipe(null);
    setLoggedItems(new Set());
    setSwapTarget(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mode,
          userProfile: {
            dietPreference: profile.dietPreference,
            fitnessGoal: profile.fitnessGoal,
            calorieTarget: profile.calorieTarget,
            proteinTarget: profile.proteinTarget,
            remainingCalories,
            remainingProtein,
            remainingCarbs,
            remainingFat,
            allergies: profile.allergies,
            schedule: profile.schedule
              .filter((e) => e.date === new Date().toISOString().slice(0, 10))
              .map((e) => `${e.title} at ${e.time} (${e.type})`),
          },
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Analysis failed (${res.status})`);
      const data = await res.json();
      if (data.items) setFoodItems(data.items);
      if (data.recipe) setRecipe(data.recipe);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
    } finally {
      setLoading(false);
    }
  };

  const resetScan = () => {
    setCapturedImage(null);
    setFoodItems([]);
    setRecipe(null);
    setError(null);
    setLoggedItems(new Set());
    setSwapTarget(null);
  };

  const logFoodItem = (item: FoodItem) => {
    if (item.recommendation === 'avoid') {
      // Show swap suggestions before logging
      setSwapTarget(item.name === swapTarget ? null : item.name);
      return;
    }
    doLogItem(item);
  };

  const doLogItem = (item: FoodItem) => {
    addMeal({
      description: item.name,
      calories: item.estimatedCalories,
      protein: item.estimatedProtein,
      carbs: item.estimatedCarbs,
      fat: item.estimatedFat,
      recommendation: item.recommendation,
      aiAdvice: item.reason,
    });
    setLoggedItems((prev) => new Set([...prev, item.name]));
    setSwapTarget(null);
  };

  const logSwapInstead = (item: FoodItem, swap: SwapSuggestion) => {
    addMeal({
      description: swap.name,
      calories: swap.estimatedCalories,
      protein: swap.estimatedProtein,
      carbs: 0,
      fat: 0,
      recommendation: 'good',
      aiAdvice: swap.reason,
    });
    setLoggedItems((prev) => new Set([...prev, item.name]));
    setSwapTarget(null);
  };

  const logAnywayIgnoringSwap = (item: FoodItem) => {
    doLogItem(item);
  };

  const logRecipe = () => {
    if (!recipe) return;
    addMeal({
      description: recipe.name,
      calories: recipe.estimatedCalories,
      protein: recipe.estimatedProtein,
      carbs: recipe.estimatedCarbs,
      fat: recipe.estimatedFat,
      recommendation: 'good',
      aiAdvice: `Recipe: ${recipe.ingredients.length} ingredients, ${recipe.cookTime}`,
    });
    setLoggedItems((prev) => new Set([...prev, recipe.name]));
  };

  const isItemSaved = (name: string) => savedMeals.some((m) => m.name === name);

  const toggleSaveMeal = (item: FoodItem) => {
    if (isItemSaved(item.name)) {
      const existing = savedMeals.find((m) => m.name === item.name);
      if (existing) unsaveMeal(existing.id);
    } else {
      saveMeal({
        name: item.name,
        calories: item.estimatedCalories,
        protein: item.estimatedProtein,
        carbs: item.estimatedCarbs,
        fat: item.estimatedFat,
        recommendation: item.recommendation,
      });
    }
  };

  const hasResults = foodItems.length > 0 || recipe !== null;
  const goalLabel = GOAL_LABELS[profile.fitnessGoal] ?? profile.fitnessGoal;

  const swapUserProfile = {
    fitnessGoal: profile.fitnessGoal,
    dietPreference: profile.dietPreference,
    allergies: profile.allergies,
    remainingCalories,
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="bg-card border-b border-border px-screen pt-14 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="type-heading text-foreground">Scan</h1>
            <p className="type-caption text-muted-foreground mt-0.5">
              Point your camera at a menu, food, or open fridge
            </p>
          </div>
          <Badge variant="secondary" className="type-micro uppercase tracking-wider flex-shrink-0">
            {goalLabel}
          </Badge>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => { setMode('menu'); resetScan(); }}
            aria-pressed={mode === 'menu'}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-lg type-label transition-colors',
              mode === 'menu' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-border',
            ].join(' ')}
          >
            <UtensilsCrossed size={16} strokeWidth={2} />
            Menu / Food
          </button>
          <button
            onClick={() => { setMode('fridge'); resetScan(); }}
            aria-pressed={mode === 'fridge'}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-lg type-label transition-colors',
              mode === 'fridge' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-border',
            ].join(' ')}
          >
            <ChefHat size={16} strokeWidth={2} />
            Fridge Mode
          </button>
        </div>
      </header>

      <div className="flex-1 px-screen py-5 flex flex-col gap-section pb-nav">

        {/* ── Camera / Upload ── */}
        {!capturedImage && (
          <section className="flex flex-col gap-3">
            <Card className="overflow-hidden p-0">
              <div className="relative aspect-[4/3] bg-muted">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode, width: { ideal: 1280 }, height: { ideal: 960 } }}
                  className="w-full h-full object-cover"
                  onUserMediaError={() => setError('Camera access denied. You can upload an image instead.')}
                />
                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Upload image from gallery"
                    className="w-12 h-12 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <ImagePlus size={20} strokeWidth={1.75} className="text-foreground" />
                  </button>
                  <button
                    onClick={capture}
                    aria-label="Take photo"
                    className="w-16 h-16 rounded-full bg-primary shadow-action flex items-center justify-center active:scale-90 transition-transform ring-4 ring-card/50"
                  >
                    <Camera size={28} strokeWidth={2} className="text-primary-foreground" />
                  </button>
                  <button
                    onClick={() => setFacingMode((f) => f === 'user' ? 'environment' : 'user')}
                    aria-label="Flip camera"
                    className="w-12 h-12 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <SwitchCamera size={20} strokeWidth={1.75} className="text-foreground" />
                  </button>
                </div>
              </div>
            </Card>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
              aria-label="Upload food image"
            />

            <div className="flex items-center justify-between px-1">
              <span className="type-micro text-muted-foreground">Remaining today:</span>
              <span className="type-micro text-foreground font-semibold tabular-nums">
                {formatKcal(remainingCalories)} kcal · {formatMacroGrams(remainingProtein)}g P · {formatMacroGrams(remainingCarbs)}g C · {formatMacroGrams(remainingFat)}g F
              </span>
            </div>
          </section>
        )}

        {/* ── Captured Image + Results ── */}
        {capturedImage && (
          <section className="flex flex-col gap-list">
            {/* Preview */}
            <Card className="overflow-hidden p-0 relative">
              <img src={capturedImage} alt="Captured food" className="w-full aspect-[4/3] object-cover" />
              <button
                onClick={resetScan}
                aria-label="Clear scan and start over"
                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
              >
                <X size={20} strokeWidth={2} className="text-foreground" />
              </button>
              {loading && (
                <div className="absolute inset-0 bg-card/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                  <Loader2 size={32} strokeWidth={2} className="text-primary animate-spin" />
                  <p className="type-label text-foreground font-semibold">
                    {mode === 'fridge' ? 'Finding ingredients & recipe...' : 'Analyzing food options...'}
                  </p>
                </div>
              )}
            </Card>

            {/* Error */}
            {error && (
              <Card className="border-destructive/20">
                <CardContent className="pt-4">
                  <p className="type-body text-destructive">{error}</p>
                  <Button onClick={resetScan} variant="default" className="mt-3 w-full">Try Again</Button>
                </CardContent>
              </Card>
            )}

            {/* Food items */}
            {foodItems.length > 0 && (
              <div className="flex flex-col gap-list">
                <h2 className="type-subheading text-foreground">
                  {mode === 'fridge' ? 'Ingredients Found' : 'Analysis Results'}
                </h2>
                {foodItems.map((item, i) => {
                  const style = RECO_STYLE[item.recommendation];
                  const Icon = style.icon;
                  const isLogged = loggedItems.has(item.name);
                  const isSwapOpen = swapTarget === item.name;
                  const saved = isItemSaved(item.name);

                  return (
                    <div key={i} className="flex flex-col gap-2">
                      <Card
                        className={['animate-fade-up border', style.border].join(' ')}
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <div className={['w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', style.bg].join(' ')}>
                              <Icon size={16} strokeWidth={2} className={style.text} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="type-label text-foreground font-semibold">{item.name}</p>
                                  <Badge variant="secondary" className={['type-micro uppercase', style.text].join(' ')}>
                                    {item.recommendation}
                                  </Badge>
                                  {item.confidence === 'low' && (
                                    <Badge variant="secondary" className="type-micro text-muted-foreground">~approx</Badge>
                                  )}
                                </div>
                                {item.servingSize && (
                                  <p className="type-micro text-muted-foreground mt-0.5">{item.servingSize}</p>
                                )}
                                <button
                                  onClick={() => toggleSaveMeal(item)}
                                  aria-label={saved ? `Remove ${item.name} from saved meals` : `Save ${item.name}`}
                                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
                                >
                                  {saved
                                    ? <BookmarkCheck size={16} strokeWidth={2} className="text-primary" />
                                    : <Bookmark size={16} strokeWidth={1.75} className="text-muted-foreground" />
                                  }
                                </button>
                              </div>
                              <p className="type-caption text-muted-foreground mt-1 line-clamp-3">{item.reason}</p>
                              <MacroStrip
                                className="mt-2"
                                calories={item.estimatedCalories}
                                protein={item.estimatedProtein}
                                carbs={item.estimatedCarbs}
                                fat={item.estimatedFat}
                              />
                            </div>
                          </div>

                          {!isLogged ? (
                            <div className="mt-3 flex gap-2">
                              <Button
                                onClick={() => logFoodItem(item)}
                                variant={item.recommendation === 'avoid' ? 'secondary' : 'default'}
                                size="sm"
                                className="flex-1"
                              >
                                {item.recommendation === 'avoid' ? 'See alternatives' : 'Log this meal'}
                              </Button>
                              {item.recommendation === 'avoid' && (
                                <Button
                                  onClick={() => logAnywayIgnoringSwap(item)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-muted-foreground"
                                >
                                  Log anyway
                                </Button>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2 mt-3 py-2 rounded-lg bg-primary/10">
                              <Check size={14} strokeWidth={2} className="text-primary" />
                              <span className="type-micro text-primary font-semibold">Logged</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Snack swap card appears inline below avoid items */}
                      {isSwapOpen && !isLogged && (
                        <SnackSwapCard
                          foodName={item.name}
                          userProfile={swapUserProfile}
                          onDismiss={() => setSwapTarget(null)}
                          onLogSwap={(swap) => logSwapInstead(item, swap)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Recipe result (fridge mode) */}
            {recipe && (
              <div className="flex flex-col gap-list">
                <h2 className="type-subheading text-foreground">Suggested Recipe</h2>
                <Card className="animate-fade-up border border-primary/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ChefHat size={16} strokeWidth={2} className="text-primary" />
                      </div>
                      <div>
                        <p className="type-label text-foreground font-semibold">{recipe.name}</p>
                        <p className="type-micro text-muted-foreground">
                          {[recipe.cookTime, recipe.servingSize].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    </div>

                    <MacroStrip
                      className="mb-3 mt-1"
                      calories={recipe.estimatedCalories}
                      protein={recipe.estimatedProtein}
                      carbs={recipe.estimatedCarbs}
                      fat={recipe.estimatedFat}
                    />

                    <h3 className="type-micro text-muted-foreground uppercase tracking-wider mb-2">Ingredients</h3>
                    <ul className="flex flex-col gap-1 mb-4">
                      {recipe.ingredients.map((ing, i) => (
                        <li key={i} className="type-caption text-foreground flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0 mt-2" />
                          {ing}
                        </li>
                      ))}
                    </ul>

                    <h3 className="type-micro text-muted-foreground uppercase tracking-wider mb-2">Steps</h3>
                    <ol className="flex flex-col gap-2 mb-4">
                      {recipe.steps.map((step, i) => (
                        <li key={i} className="type-caption text-foreground flex items-start gap-2">
                          <span className="type-micro text-primary font-semibold flex-shrink-0 w-5">{i + 1}.</span>
                          {step}
                        </li>
                      ))}
                    </ol>

                    {!loggedItems.has(recipe.name) ? (
                      <Button onClick={logRecipe} variant="default" className="w-full">Log this recipe</Button>
                    ) : (
                      <div className="flex items-center justify-center gap-2 py-2 rounded-lg bg-primary/10">
                        <Check size={14} strokeWidth={2} className="text-primary" />
                        <span className="type-micro text-primary font-semibold">Logged</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {hasResults && (
              <Button onClick={resetScan} variant="secondary" className="w-full">
                <RefreshCw size={16} strokeWidth={2} className="mr-2" />
                Scan again
              </Button>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
