'use client';

import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useUserProfile } from '@/context/UserProfileContext';
import {
  Camera,
  SwitchCamera,
  X,
  ChefHat,
  UtensilsCrossed,
  Check,
  AlertTriangle,
  Minus,
  Loader2,
  ImagePlus,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { FoodItem, RecipeResult } from '@/context/UserProfileContext';

type ScanMode = 'menu' | 'fridge';

const RECO_STYLE: Record<string, { bg: string; text: string; border: string; icon: React.ElementType }> = {
  good:  { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', icon: Check },
  okay:  { bg: 'bg-feedback-warning/10', text: 'text-feedback-warning', border: 'border-feedback-warning/20', icon: Minus },
  avoid: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20', icon: AlertTriangle },
};

export default function ActionPage() {
  const {
    profile,
    remainingCalories,
    remainingProtein,
    remainingCarbs,
    remainingFat,
    addMeal,
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

  const capture = useCallback(() => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      analyzeImage(imageSrc);
    }
  }, []);

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
  }, []);

  const analyzeImage = async (imageBase64: string) => {
    setLoading(true);
    setError(null);
    setFoodItems([]);
    setRecipe(null);
    setLoggedItems(new Set());

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

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Analysis failed (${res.status})`);
      }

      const data = await res.json();
      if (data.items) setFoodItems(data.items);
      if (data.recipe) setRecipe(data.recipe);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to analyze image';
      setError(message);
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
  };

  const logFoodItem = (item: FoodItem) => {
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

  const hasResults = foodItems.length > 0 || recipe !== null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Header ── */}
      <header className="bg-card border-b border-border px-screen pt-14 pb-4">
        <h1 className="type-heading text-foreground">Scan</h1>
        <p className="type-caption text-muted-foreground mt-1">
          Point your camera at a menu, food, or open fridge
        </p>

        {/* Mode toggle */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => { setMode('menu'); resetScan(); }}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-lg type-label transition-colors',
              mode === 'menu'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-border',
            ].join(' ')}
          >
            <UtensilsCrossed size={16} strokeWidth={2} />
            Menu / Food
          </button>
          <button
            onClick={() => { setMode('fridge'); resetScan(); }}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-lg type-label transition-colors',
              mode === 'fridge'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-border',
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
                  videoConstraints={{
                    facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 960 },
                  }}
                  className="w-full h-full object-cover"
                  onUserMediaError={() => setError('Camera access denied. You can upload an image instead.')}
                />

                {/* Camera controls overlay */}
                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-12 h-12 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <ImagePlus size={20} strokeWidth={1.75} className="text-foreground" />
                  </button>

                  <button
                    onClick={capture}
                    className="w-16 h-16 rounded-full bg-primary shadow-action flex items-center justify-center active:scale-90 transition-transform ring-4 ring-card/50"
                  >
                    <Camera size={28} strokeWidth={2} className="text-primary-foreground" />
                  </button>

                  <button
                    onClick={() => setFacingMode((f) => f === 'user' ? 'environment' : 'user')}
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
            />

            {/* Remaining budget reminder */}
            <div className="flex items-center justify-between px-1">
              <span className="type-micro text-muted-foreground">Remaining today:</span>
              <span className="type-micro text-foreground font-semibold">
                {Math.round(remainingCalories)} kcal · {Math.round(remainingProtein)}g P · {Math.round(remainingCarbs)}g C · {Math.round(remainingFat)}g F
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
                  <Button onClick={resetScan} variant="default" className="mt-3 w-full">
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Food items results */}
            {foodItems.length > 0 && (
              <div className="flex flex-col gap-list">
                <h2 className="type-subheading text-foreground">
                  {mode === 'fridge' ? 'Ingredients Found' : 'Analysis Results'}
                </h2>
                {foodItems.map((item, i) => {
                  const style = RECO_STYLE[item.recommendation];
                  const Icon = style.icon;
                  const isLogged = loggedItems.has(item.name);

                  return (
                    <Card
                      key={i}
                      className={['animate-fade-up border', style.border].join(' ')}
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <div className={['w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', style.bg].join(' ')}>
                            <Icon size={16} strokeWidth={2} className={style.text} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="type-label text-foreground font-semibold">{item.name}</p>
                              <Badge
                                variant="secondary"
                                className={['type-micro uppercase', style.text].join(' ')}
                              >
                                {item.recommendation}
                              </Badge>
                            </div>
                            <p className="type-caption text-muted-foreground mt-1">{item.reason}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="type-micro text-muted-foreground">{item.estimatedCalories} kcal</span>
                              <span className="type-micro text-muted-foreground">{item.estimatedProtein}g P</span>
                              <span className="type-micro text-muted-foreground">{item.estimatedCarbs}g C</span>
                              <span className="type-micro text-muted-foreground">{item.estimatedFat}g F</span>
                            </div>
                          </div>
                        </div>
                        {!isLogged ? (
                          <Button
                            onClick={() => logFoodItem(item)}
                            variant="default"
                            size="sm"
                            className="w-full mt-3"
                          >
                            Log This Meal
                          </Button>
                        ) : (
                          <div className="flex items-center justify-center gap-2 mt-3 py-2 rounded-lg bg-primary/10">
                            <Check size={14} strokeWidth={2} className="text-primary" />
                            <span className="type-micro text-primary font-semibold">Logged</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
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
                        <p className="type-micro text-muted-foreground">{recipe.cookTime}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <span className="type-micro text-muted-foreground">{recipe.estimatedCalories} kcal</span>
                      <span className="type-micro text-muted-foreground">{recipe.estimatedProtein}g P</span>
                      <span className="type-micro text-muted-foreground">{recipe.estimatedCarbs}g C</span>
                      <span className="type-micro text-muted-foreground">{recipe.estimatedFat}g F</span>
                    </div>

                    <h3 className="type-micro text-muted-foreground uppercase tracking-wider mb-2">Ingredients</h3>
                    <ul className="flex flex-col gap-1 mb-4">
                      {recipe.ingredients.map((ing, i) => (
                        <li key={i} className="type-caption text-foreground flex items-start gap-2">
                          <span className="text-primary mt-1.5 w-1 h-1 rounded-full bg-primary flex-shrink-0" />
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
                      <Button onClick={logRecipe} variant="default" className="w-full">
                        Log This Recipe
                      </Button>
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

            {/* Scan again button */}
            {hasResults && (
              <Button onClick={resetScan} variant="secondary" className="w-full">
                Scan Again
              </Button>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
