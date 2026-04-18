'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useUserProfile } from '@/context/UserProfileContext';
import { calcBMI, getBMICategory } from '@/context/UserProfileContext';
import type {
  NearbyOption, MicroIntervention, MealTimingAdvice, FitnessGoal,
} from '@/context/UserProfileContext';
import {
  Flame, Beef, Wheat, Droplets, Trash2, Camera, MapPin, Loader2,
  Clock, Plane, Radio, Users, Dumbbell, Calendar, Navigation, Heart,
  Wind, Droplet, Moon, Check, AlertTriangle, Minus, RefreshCw,
  Plus, X, Scale, TrendingUp, ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getTimeLabel(timestamp: number): string {
  const diff = Math.round((Date.now() - timestamp) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  const hr = Math.round(diff / 60);
  if (hr < 24) return `${hr}h ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const TODAY = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EVENT_ICONS: Record<string, React.ElementType> = {
  flight: Plane, broadcast: Radio, meeting: Users, workout: Dumbbell, other: Calendar,
};

const INTERVENTION_ICONS: Record<string, React.ElementType> = {
  movement: Heart, breathing: Wind, hydration: Droplet, rest: Moon,
};

const RECO_ICON: Record<string, React.ElementType> = {
  good: Check, okay: Minus, avoid: AlertTriangle,
};

const RECO_STYLE: Record<string, { bg: string; text: string }> = {
  good:  { bg: 'bg-primary/10',          text: 'text-primary' },
  okay:  { bg: 'bg-feedback-warning/10', text: 'text-feedback-warning' },
  avoid: { bg: 'bg-destructive/10',      text: 'text-destructive' },
};

const GOAL_MODES: { value: FitnessGoal; label: string }[] = [
  { value: 'lose_weight',  label: 'Fat Loss' },
  { value: 'gain_muscle',  label: 'Muscle Gain' },
  { value: 'maintain',     label: 'Maintain' },
  { value: 'endurance',    label: 'Endurance' },
  { value: 'heart_health', label: 'Heart Health' },
  { value: 'low_sodium',   label: 'Low Sodium' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function MacroCard({
  label, current, target, unit, icon: Icon, progress, delay,
}: {
  label: string; current: number; target: number; unit: string;
  icon: React.ElementType; progress: number; delay: number;
}) {
  return (
    <Card className="animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <CardContent className="flex flex-col gap-2 pt-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-primary">
            <Icon size={14} strokeWidth={2} />
          </div>
          <span className="type-micro text-muted-foreground uppercase tracking-wider">{label}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="type-heading text-foreground">{Math.round(current)}</span>
          <span className="type-micro text-muted-foreground">/ {target}{unit}</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </CardContent>
    </Card>
  );
}

function WeeklyChart({ history, calorieTarget }: { history: { date: string; totalCalories: number }[]; calorieTarget: number }) {
  const max = Math.max(calorieTarget, ...history.map((h) => h.totalCalories));
  return (
    <div className="flex items-end gap-1.5 h-20">
      {history.map((h) => {
        const pct = max > 0 ? (h.totalCalories / max) * 100 : 0;
        const d = new Date(h.date + 'T00:00:00');
        const isToday = h.date === new Date().toISOString().slice(0, 10);
        return (
          <div key={h.date} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-muted rounded-t-sm overflow-hidden" style={{ height: '56px' }}>
              <div
                className={['w-full rounded-t-sm transition-all duration-500', isToday ? 'bg-primary' : 'bg-primary/40'].join(' ')}
                style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
              />
            </div>
            <span className={['type-micro', isToday ? 'text-primary font-semibold' : 'text-muted-foreground'].join(' ')}>
              {DAY_LABELS[d.getDay()]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function WeightSparkline({ log }: { log: { date: string; weightKg: number }[] }) {
  if (log.length < 2) return null;
  const last7 = log.slice(-7);
  const min = Math.min(...last7.map((w) => w.weightKg)) - 1;
  const max = Math.max(...last7.map((w) => w.weightKg)) + 1;
  const range = max - min || 1;
  const W = 200, H = 40;
  const pts = last7.map((w, i) => {
    const x = (i / (last7.length - 1)) * W;
    const y = H - ((w.weightKg - min) / range) * H;
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-10" preserveAspectRatio="none">
      <polyline points={pts.join(' ')} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Quick Log ─────────────────────────────────────────────────────────────────

interface EstimateResult {
  name: string;
  servingSize: string;
  estimatedCalories: number;
  estimatedProtein: number;
  estimatedCarbs: number;
  estimatedFat: number;
  recommendation: 'good' | 'okay' | 'avoid';
  reason: string;
  confidence: string;
}

function QuickLog({
  remainingCalories, remainingProtein,
  fitnessGoal, dietPreference, allergies,
  onLog,
}: {
  remainingCalories: number;
  remainingProtein: number;
  fitnessGoal: string;
  dietPreference: string;
  allergies: string[];
  onLog: (result: EstimateResult) => void;
}) {
  const [query, setQuery] = useState('');
  const [serving, setServing] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const estimate = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/food-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodDescription: query.trim(),
          servingSize: serving.trim() || undefined,
          userProfile: { fitnessGoal, dietPreference, allergies, remainingCalories, remainingProtein },
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Estimation failed');
      setResult(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to estimate');
    } finally {
      setLoading(false);
    }
  };

  const handleLog = () => {
    if (!result) return;
    onLog(result);
    setQuery('');
    setServing('');
    setResult(null);
    setExpanded(false);
  };

  const style = result ? RECO_STYLE[result.recommendation] : null;

  return (
    <div className="flex flex-col gap-list">
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-muted text-muted-foreground type-label hover:bg-border transition-colors text-left"
        >
          <Plus size={16} strokeWidth={2} className="text-primary flex-shrink-0" />
          Log a food manually...
        </button>
      ) : (
        <Card className="animate-fade-up">
          <CardContent className="pt-4 flex flex-col gap-list">
            <div className="flex items-center justify-between">
              <p className="type-label text-foreground font-semibold">Quick Log</p>
              <button
                onClick={() => { setExpanded(false); setResult(null); setError(null); }}
                aria-label="Close quick log"
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
              >
                <X size={14} strokeWidth={2} className="text-muted-foreground" />
              </button>
            </div>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. grilled chicken breast, large coffee with milk"
              onKeyDown={(e) => e.key === 'Enter' && estimate()}
              autoFocus
            />
            <Input
              value={serving}
              onChange={(e) => setServing(e.target.value)}
              placeholder="Serving size (optional, e.g. 200g, 1 cup)"
            />
            <Button
              onClick={estimate}
              disabled={loading || !query.trim()}
              variant="default"
              className="w-full"
            >
              {loading ? <Loader2 size={16} strokeWidth={2} className="animate-spin mr-2" /> : null}
              {loading ? 'Estimating...' : 'Estimate macros'}
            </Button>

            {error && <p className="type-caption text-destructive">{error}</p>}

            {result && style && (
              <div className={['rounded-xl border p-3', style.bg.replace('/10', '/5'), `border-${style.text.replace('text-', '')}/20`].join(' ')}>
                <div className="flex items-center gap-2 mb-1">
                  <p className="type-label text-foreground font-semibold">{result.name}</p>
                  <Badge variant="secondary" className={['type-micro', style.text].join(' ')}>
                    {result.recommendation}
                  </Badge>
                  {result.confidence === 'low' && (
                    <Badge variant="secondary" className="type-micro text-muted-foreground">~approx</Badge>
                  )}
                </div>
                <p className="type-micro text-muted-foreground mb-2">{result.servingSize}</p>
                <div className="flex gap-3 mb-2">
                  <span className="type-micro text-foreground">{result.estimatedCalories} kcal</span>
                  <span className="type-micro text-muted-foreground">{result.estimatedProtein}g P</span>
                  <span className="type-micro text-muted-foreground">{result.estimatedCarbs}g C</span>
                  <span className="type-micro text-muted-foreground">{result.estimatedFat}g F</span>
                </div>
                <p className="type-caption text-muted-foreground mb-3">{result.reason}</p>
                <Button onClick={handleLog} variant="default" size="sm" className="w-full">
                  <Check size={14} strokeWidth={2} className="mr-1.5" />
                  Log it
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const {
    profile, updateProfile, todayLog, weekHistory,
    remainingCalories, remainingProtein, remainingCarbs, remainingFat,
    calorieProgress, proteinProgress, carbProgress, fatProgress,
    addMeal, removeMeal, todayEvents,
    location, locationError, requestLocation,
    weightLog, logWeight,
  } = useUserProfile();

  const [suggestions, setSuggestions] = useState<{
    nearbyOptions: NearbyOption[];
    microInterventions: MicroIntervention[];
    mealTimingAdvice: MealTimingAdvice | null;
    proactiveAlert: string;
  } | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [weightInput, setWeightInput] = useState('');
  const hasFetched = useRef(false);

  const displayName = profile.name || 'there';

  // Instant rule-based meal timing — shown immediately, no AI wait
  const instantMealTiming = useMemo((): MealTimingAdvice => {
    const hour = new Date().getHours();
    const isLowBudget = remainingCalories < 450;
    const isHighProtein = remainingProtein > 35;
    if (remainingCalories <= 0) {
      return { nextMealIn: 'Budget met', mealType: 'Budget met for today — focus on hydration.', reason: 'You\'ve hit your calorie target for today.' };
    }
    if (hour < 7) {
      return { nextMealIn: '60–90 min', mealType: isLowBudget ? 'snack' : 'light', reason: `Early morning — a ${isHighProtein ? 'protein-forward' : 'light'} breakfast will set your energy for the day.` };
    } else if (hour < 11) {
      return { nextMealIn: '30–60 min', mealType: 'moderate', reason: `Morning window — fuel up to protect ${remainingCalories} kcal remaining.` };
    } else if (hour < 14) {
      return { nextMealIn: 'Now', mealType: isLowBudget ? 'light' : 'moderate', reason: `Lunch time. ${isLowBudget ? `Keep it light — only ${remainingCalories} kcal left.` : `Use ~${Math.round(remainingCalories * 0.4)} kcal here.`}` };
    } else if (hour < 17) {
      return { nextMealIn: '45–90 min', mealType: 'snack', reason: `Afternoon — a protein snack will carry you to dinner within your ${remainingCalories} kcal budget.` };
    } else if (hour < 20) {
      return { nextMealIn: 'Now', mealType: isLowBudget ? 'light' : 'moderate', reason: `Dinner window. ${isLowBudget ? `${remainingCalories} kcal left — keep it lean.` : 'Good time for your main evening meal.'}` };
    } else {
      return { nextMealIn: '60–90 min', mealType: 'snack', reason: `Late evening — ${remainingCalories > 300 ? 'a small protein snack fits your budget' : 'close out with hydration only'}.` };
    }
  }, [remainingCalories, remainingProtein]);

  const fetchSuggestions = useCallback(async () => {
    if (!location) return;
    setSuggestionsLoading(true);
    setSuggestionsError(null);
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          currentTime: new Date().toISOString(),
          userProfile: {
            dietPreference: profile.dietPreference,
            fitnessGoal: profile.fitnessGoal,
            calorieTarget: profile.calorieTarget,
            proteinTarget: profile.proteinTarget,
            remainingCalories,
            remainingProtein,
            allergies: profile.allergies,
          },
          schedule: todayEvents.map((e) => ({ title: e.title, time: e.time, type: e.type })),
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to get suggestions');
      setSuggestions(await res.json());
    } catch (err: unknown) {
      setSuggestionsError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSuggestionsLoading(false);
    }
  }, [location, profile, remainingCalories, remainingProtein, todayEvents]);

  useEffect(() => {
    if (location && profile.setupComplete && !hasFetched.current) {
      hasFetched.current = true;
      fetchSuggestions();
    }
  }, [location, profile.setupComplete, fetchSuggestions]);

  const handleLogWeight = () => {
    const kg = parseFloat(weightInput);
    if (!kg || kg < 20 || kg > 400) return;
    logWeight(kg);
    setWeightInput('');
  };

  const bmi = profile.heightCm && profile.weightKg ? calcBMI(profile.weightKg, profile.heightCm) : null;
  const bmiCat = bmi ? getBMICategory(bmi) : null;

  // Meal quality trend for the week
  const mealQualityWeek = weekHistory.map((day) => {
    const good = day.meals.filter((m) => m.recommendation === 'good').length;
    const total = day.meals.length;
    return { date: day.date, score: total > 0 ? good / total : null };
  });

  // Onboarding gate — redirect to onboarding wizard
  if (!profile.setupComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-screen gap-section">
        <div className="text-center">
          <h1 className="type-display text-foreground mt-[30px]">Welcome to AnchorFuel</h1>
          <p className="type-body text-muted-foreground mt-3 max-w-xs mx-auto">
            Set up your health profile to get personalized meal recommendations.
          </p>
        </div>
        <Link href="/onboarding">
          <button className="px-8 py-4 bg-primary text-primary-foreground rounded-xl type-label font-semibold shadow-action active:scale-95 transition-transform">
            Set Up Profile
          </button>
        </Link>
      </div>
    );
  }

  const MACROS = [
    { label: 'Calories', current: todayLog.totalCalories, target: profile.calorieTarget, unit: '', icon: Flame, progress: calorieProgress },
    { label: 'Protein',  current: todayLog.totalProtein,  target: profile.proteinTarget, unit: 'g', icon: Beef,    progress: proteinProgress },
    { label: 'Carbs',    current: todayLog.totalCarbs,    target: profile.carbTarget,    unit: 'g', icon: Wheat,   progress: carbProgress },
    { label: 'Fat',      current: todayLog.totalFat,      target: profile.fatTarget,     unit: 'g', icon: Droplets,progress: fatProgress },
  ];

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <header className="bg-card border-b border-border px-screen pt-14 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="type-micro text-muted-foreground uppercase tracking-wider">{TODAY}</p>
            <h1 className="type-heading text-foreground mt-1">
              {getGreeting()}, {displayName.split(' ')[0]}
            </h1>
          </div>
          <Badge variant="secondary" className="type-micro uppercase tracking-wider">
            {profile.dietPreference === 'any' ? 'No restrictions' : profile.dietPreference}
          </Badge>
        </div>

        {/* Goal mode switcher */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-none -mx-screen px-screen pb-1">
          {GOAL_MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => updateProfile({ fitnessGoal: mode.value })}
              className={[
                'flex-shrink-0 px-3 py-1.5 rounded-full type-micro border transition-colors',
                profile.fitnessGoal === mode.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted text-muted-foreground border-transparent hover:border-border',
              ].join(' ')}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <div className="flex justify-between items-baseline">
            <span className="type-micro text-muted-foreground">Remaining today</span>
            <span className="type-micro text-foreground font-semibold">{Math.round(remainingCalories)} kcal left</span>
          </div>
          <Progress value={calorieProgress} className="h-2 mt-2" />
        </div>
      </header>

      <div className="px-screen py-5 flex flex-col gap-section pb-nav">

        {/* ── Proactive Alert ── */}
        {suggestions?.proactiveAlert && (
          <Card className="border-primary/30 animate-fade-up relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <CardContent className="pt-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Navigation size={20} strokeWidth={2} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="type-micro text-primary font-bold uppercase tracking-widest mb-1">AI Alert</p>
                <p className="type-body text-foreground leading-relaxed">{suggestions.proactiveAlert}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Today's Schedule ── */}
        {todayEvents.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="type-subheading text-foreground">Today&apos;s Schedule</h2>
              <span className="type-micro text-muted-foreground">{todayEvents.length} events</span>
            </div>
            <Card>
              <CardContent className="px-inner py-0 divide-y divide-border">
                {todayEvents.map((evt) => {
                  const EvtIcon = EVENT_ICONS[evt.type] || Calendar;
                  return (
                    <div key={evt.id} className="flex items-center gap-3 py-3.5">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <EvtIcon size={16} strokeWidth={1.75} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="type-label text-foreground">{evt.title}</p>
                        <p className="type-micro text-muted-foreground">{evt.time} · {evt.type}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </section>
        )}

        {/* ── Macro Cards ── */}
        <section aria-label="Today's macros">
          <div className="grid grid-cols-2 gap-cols">
            {MACROS.map((m, i) => (
              <MacroCard key={m.label} {...m} delay={i * 40} />
            ))}
          </div>
        </section>

        {/* ── BMI Card ── */}
        {bmi && bmiCat && (
          <section>
            <h2 className="type-subheading text-foreground mb-3">Body Stats</h2>
            <Card>
              <CardContent className="pt-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <Scale size={20} strokeWidth={1.75} className="text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className={['type-heading', bmiCat.token].join(' ')}>{bmi.toFixed(1)}</span>
                    <span className="type-caption text-muted-foreground">BMI</span>
                    <Badge variant="secondary" className="type-micro">{bmiCat.label}</Badge>
                  </div>
                  {profile.weightKg && (
                    <p className="type-caption text-muted-foreground mt-0.5">
                      Current weight: {profile.weightKg} kg
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* ── Weight Tracker ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="type-subheading text-foreground">Weight Log</h2>
            {weightLog.length > 0 && (
              <span className="type-micro text-muted-foreground">{weightLog.length} entries</span>
            )}
          </div>
          <Card>
            <CardContent className="pt-4 flex flex-col gap-list">
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder="Log weight (kg)"
                  min={20}
                  max={400}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogWeight()}
                  className="flex-1"
                  aria-label="Weight in kilograms"
                />
                <Button
                  onClick={handleLogWeight}
                  disabled={!weightInput.trim()}
                  variant="default"
                  size="sm"
                  aria-label="Log weight"
                  className="px-4"
                >
                  <Check size={16} strokeWidth={2} />
                </Button>
              </div>
              {weightLog.length >= 2 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="type-micro text-muted-foreground">7-day trend</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp size={12} strokeWidth={2} className="text-primary" />
                      <span className="type-micro text-primary">
                        {weightLog[weightLog.length - 1].weightKg} kg
                      </span>
                    </div>
                  </div>
                  <WeightSparkline log={weightLog} />
                </div>
              )}
              {weightLog.length === 0 && (
                <p className="type-caption text-muted-foreground text-center py-2">
                  Log your first weight to track progress.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ── Meal Timing — shown instantly from local rules; AI result swaps in when ready ── */}
        {profile.setupComplete && (() => {
          const timing = suggestions?.mealTimingAdvice ?? instantMealTiming;
          const isAI = !!suggestions?.mealTimingAdvice;
          return (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="type-subheading text-foreground">Meal Timing</h2>
                {!isAI && suggestionsLoading && (
                  <span className="flex items-center gap-1 type-micro text-muted-foreground">
                    <Loader2 size={10} strokeWidth={2} className="animate-spin" />
                    AI refining…
                  </span>
                )}
              </div>
              <Card>
                <CardContent className="pt-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <Clock size={16} strokeWidth={2} className="text-primary" />
                  </div>
                  <div>
                    <p className="type-label text-foreground">
                      Next meal in {timing.nextMealIn}
                      <span className="type-micro text-muted-foreground ml-2">({timing.mealType})</span>
                    </p>
                    <p className="type-caption text-muted-foreground mt-1">{timing.reason}</p>
                  </div>
                </CardContent>
              </Card>
            </section>
          );
        })()}

        {/* ── Nearby Options (quick view) ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="type-subheading text-foreground">Nearby Options</h2>
            <div className="flex items-center gap-3">
              {location && (
                <button
                  onClick={fetchSuggestions}
                  disabled={suggestionsLoading}
                  aria-label="Refresh nearby suggestions"
                  className="flex items-center gap-1 type-caption text-primary font-semibold active:opacity-70 transition-opacity"
                >
                  <RefreshCw size={12} strokeWidth={2} className={suggestionsLoading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              )}
              <Link href="/map" className="flex items-center gap-1 type-caption text-primary font-semibold active:opacity-70 transition-opacity">
                Map <ArrowRight size={12} strokeWidth={2} />
              </Link>
            </div>
          </div>

          {suggestionsLoading && !suggestions && (
            <Card>
              <CardContent className="flex items-center justify-center py-8 gap-3">
                <Loader2 size={20} strokeWidth={2} className="text-primary animate-spin" />
                <span className="type-body text-muted-foreground">Finding options near you...</span>
              </CardContent>
            </Card>
          )}

          {!location && (
            <Card>
              <CardContent className="flex flex-col items-center py-6 gap-2">
                <MapPin size={24} strokeWidth={1.75} className="text-muted-foreground" />
                <p className="type-caption text-muted-foreground text-center">Enable location for nearby food suggestions.</p>
                <Button onClick={requestLocation} variant="default" size="sm" className="mt-2">Allow Location</Button>
              </CardContent>
            </Card>
          )}

          {suggestionsError && (
            <Card className="border-destructive/20">
              <CardContent className="pt-4">
                <p className="type-caption text-destructive">{suggestionsError}</p>
                <Button onClick={fetchSuggestions} variant="default" size="sm" className="mt-2 w-full">Retry</Button>
              </CardContent>
            </Card>
          )}

          {suggestions?.nearbyOptions && suggestions.nearbyOptions.length > 0 && (
            <div className="flex flex-col gap-list">
              {suggestions.nearbyOptions.slice(0, 3).map((opt, i) => {
                const style = RECO_STYLE[opt.type] ?? RECO_STYLE.good;
                const Icon = RECO_ICON[opt.type] ?? Check;
                return (
                  <Card key={i} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className={['w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', style.bg].join(' ')}>
                          <Icon size={16} strokeWidth={2} className={style.text} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="type-label text-foreground font-semibold">{opt.venue}</p>
                            <span className="type-micro text-muted-foreground">{opt.distance}</span>
                          </div>
                          <p className="type-caption text-foreground mt-1">{opt.recommendation}</p>
                          <p className="type-micro text-muted-foreground mt-1">{opt.reason}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Micro-Interventions ── */}
        {suggestions?.microInterventions && suggestions.microInterventions.length > 0 && (
          <section>
            <h2 className="type-subheading text-foreground mb-3">Micro-Interventions</h2>
            <div className="flex flex-col gap-list">
              {suggestions.microInterventions.map((int, i) => {
                const IntIcon = INTERVENTION_ICONS[int.type] ?? Heart;
                return (
                  <Card key={i} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                    <CardContent className="pt-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <IntIcon size={16} strokeWidth={2} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="type-label text-foreground font-semibold">{int.title}</p>
                          <Badge variant="secondary" className="type-micro">{int.duration}</Badge>
                        </div>
                        <p className="type-caption text-muted-foreground mt-1">{int.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Weekly Chart + Meal Quality ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="type-subheading text-foreground">This Week</h2>
            <span className="type-micro text-muted-foreground">Target: {profile.calorieTarget} kcal/day</span>
          </div>
          <Card>
            <CardContent className="pt-4 flex flex-col gap-4">
              <WeeklyChart history={weekHistory} calorieTarget={profile.calorieTarget} />

              {/* Meal quality bars */}
              <div>
                <p className="type-micro text-muted-foreground mb-2 uppercase tracking-widest">Meal quality trend</p>
                <div className="flex items-end gap-1.5 h-8">
                  {mealQualityWeek.map((day) => {
                    const d = new Date(day.date + 'T00:00:00');
                    const isToday = day.date === new Date().toISOString().slice(0, 10);
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5">
                        <div className="w-full bg-muted rounded-t-sm overflow-hidden" style={{ height: '20px' }}>
                          {day.score !== null && (
                            <div
                              className={['w-full rounded-t-sm', day.score >= 0.6 ? 'bg-primary' : day.score >= 0.3 ? 'bg-feedback-warning' : 'bg-destructive'].join(' ')}
                              style={{ height: `${day.score * 100}%`, marginTop: `${(1 - day.score) * 100}%` }}
                            />
                          )}
                        </div>
                        <span className={['type-micro text-[9px]', isToday ? 'text-primary font-semibold' : 'text-muted-foreground'].join(' ')}>
                          {DAY_LABELS[d.getDay()]}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="type-micro text-muted-foreground mt-1 text-center">% of meals rated &quot;good&quot; per day</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── Today's Meals + Quick Log ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="type-subheading text-foreground">Today&apos;s Meals</h2>
            <span className="type-micro text-muted-foreground">{todayLog.meals.length} logged</span>
          </div>

          <div className="flex flex-col gap-list mb-list">
            <QuickLog
              remainingCalories={remainingCalories}
              remainingProtein={remainingProtein}
              fitnessGoal={profile.fitnessGoal}
              dietPreference={profile.dietPreference}
              allergies={profile.allergies}
              onLog={(result) => addMeal({
                description: result.name,
                calories: result.estimatedCalories,
                protein: result.estimatedProtein,
                carbs: result.estimatedCarbs,
                fat: result.estimatedFat,
                recommendation: result.recommendation,
                aiAdvice: result.reason,
              })}
            />
          </div>

          {todayLog.meals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-8 gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-primary">
                  <Camera size={24} strokeWidth={1.75} />
                </div>
                <p className="type-body text-muted-foreground text-center max-w-[200px]">
                  No meals logged yet. Scan a menu or use Quick Log above.
                </p>
                <Link href="/action">
                  <button className="type-label text-primary font-semibold active:opacity-70 transition-opacity">
                    Open Scanner
                  </button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="px-inner py-0 divide-y divide-border">
                {todayLog.meals.map((meal) => (
                  <div key={meal.id} className="flex items-start gap-3 py-4">
                    <div className={[
                      'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                      meal.recommendation === 'good' ? 'bg-primary' :
                      meal.recommendation === 'okay' ? 'bg-feedback-warning' : 'bg-destructive',
                    ].join(' ')} />
                    <div className="flex-1 min-w-0">
                      <p className="type-label text-foreground">{meal.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="type-micro text-muted-foreground">{meal.calories} kcal</span>
                        <span className="type-micro text-muted-foreground">·</span>
                        <span className="type-micro text-muted-foreground">{meal.protein}g P</span>
                        <span className="type-micro text-muted-foreground">·</span>
                        <span className="type-micro text-muted-foreground">{meal.carbs}g C</span>
                        <span className="type-micro text-muted-foreground">·</span>
                        <span className="type-micro text-muted-foreground">{meal.fat}g F</span>
                      </div>
                      {meal.aiAdvice && (
                        <p className="type-caption text-muted-foreground mt-1 line-clamp-2">{meal.aiAdvice}</p>
                      )}
                      <span className="type-micro text-muted-foreground mt-1 block">{getTimeLabel(meal.timestamp)}</span>
                    </div>
                    <button
                      onClick={() => removeMeal(meal.id)}
                      aria-label={`Remove ${meal.description} from log`}
                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted active:bg-destructive/10 transition-colors mt-0.5"
                    >
                      <Trash2 size={14} strokeWidth={1.75} className="text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </section>

      </div>
    </div>
  );
}
