'use client';

import { useUserProfile } from '@/context/UserProfileContext';
import {
  Flame,
  Beef,
  Wheat,
  Droplets,
  ChevronRight,
  Trash2,
  Camera,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getTimeLabel(timestamp: number): string {
  const d = new Date(timestamp);
  const now = new Date();
  const diffMin = Math.round((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const TODAY = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Macro Ring ───────────────────────────────────────────────────────────────

function MacroCard({
  label,
  current,
  target,
  unit,
  icon: Icon,
  progress,
  delay,
}: {
  label: string;
  current: number;
  target: number;
  unit: string;
  icon: React.ElementType;
  progress: number;
  delay: number;
}) {
  return (
    <Card
      className="animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
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

// ─── Weekly Chart ─────────────────────────────────────────────────────────────

function WeeklyChart({ history, calorieTarget }: { history: { date: string; totalCalories: number }[]; calorieTarget: number }) {
  const max = Math.max(calorieTarget, ...history.map((h) => h.totalCalories));

  return (
    <div className="flex items-end gap-1.5 h-20">
      {history.map((h) => {
        const pct = max > 0 ? (h.totalCalories / max) * 100 : 0;
        const d = new Date(h.date + 'T00:00:00');
        const dayLabel = DAY_LABELS[d.getDay()];
        const isToday = h.date === new Date().toISOString().slice(0, 10);

        return (
          <div key={h.date} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-muted rounded-t-sm overflow-hidden" style={{ height: '56px' }}>
              <div
                className={[
                  'w-full rounded-t-sm transition-all duration-500',
                  isToday ? 'bg-primary' : 'bg-primary/40',
                ].join(' ')}
                style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
              />
            </div>
            <span className={[
              'type-micro',
              isToday ? 'text-primary font-semibold' : 'text-muted-foreground',
            ].join(' ')}>
              {dayLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const {
    profile,
    todayLog,
    weekHistory,
    remainingCalories,
    calorieProgress,
    proteinProgress,
    carbProgress,
    fatProgress,
    removeMeal,
  } = useUserProfile();

  const displayName = profile.name || 'there';

  // If setup is not complete, show onboarding nudge
  if (!profile.setupComplete) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-screen gap-section">
        <div className="text-center">
          <h1 className="type-display text-foreground">Welcome to AnchorFuel</h1>
          <p className="type-body text-muted-foreground mt-3 max-w-xs mx-auto">
            Set up your health profile to get personalized meal recommendations.
          </p>
        </div>
        <Link href="/profile">
          <button className="px-8 py-4 bg-primary text-primary-foreground rounded-xl type-label font-semibold shadow-action active:scale-95 transition-transform">
            Set Up Profile
          </button>
        </Link>
      </div>
    );
  }

  const MACROS = [
    { label: 'Calories', current: todayLog.totalCalories, target: profile.calorieTarget, unit: '', icon: Flame, progress: calorieProgress },
    { label: 'Protein', current: todayLog.totalProtein, target: profile.proteinTarget, unit: 'g', icon: Beef, progress: proteinProgress },
    { label: 'Carbs', current: todayLog.totalCarbs, target: profile.carbTarget, unit: 'g', icon: Wheat, progress: carbProgress },
    { label: 'Fat', current: todayLog.totalFat, target: profile.fatTarget, unit: 'g', icon: Droplets, progress: fatProgress },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="bg-card border-b border-border px-screen pt-14 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="type-micro text-muted-foreground uppercase tracking-wider">{TODAY}</p>
            <h1 className="type-heading text-foreground mt-1">
              {getGreeting()}, {displayName.split(' ')[0]}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="type-micro uppercase tracking-wider">
              {profile.dietPreference === 'any' ? 'No restrictions' : profile.dietPreference}
            </Badge>
          </div>
        </div>

        {/* Calorie remaining hero */}
        <div className="mt-4">
          <div className="flex justify-between items-baseline">
            <span className="type-micro text-muted-foreground">Remaining today</span>
            <span className="type-micro text-foreground font-semibold">
              {Math.round(remainingCalories)} kcal left
            </span>
          </div>
          <Progress value={calorieProgress} className="h-2 mt-2" />
        </div>
      </header>

      {/* ── Content ── */}
      <div className="px-screen py-5 flex flex-col gap-section pb-nav">

        {/* Macro cards */}
        <section>
          <div className="grid grid-cols-2 gap-cols">
            {MACROS.map((m, i) => (
              <MacroCard key={m.label} {...m} delay={i * 40} />
            ))}
          </div>
        </section>

        {/* Weekly chart */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="type-subheading text-foreground">This Week</h2>
            <span className="type-micro text-muted-foreground">
              Target: {profile.calorieTarget} kcal/day
            </span>
          </div>
          <Card>
            <CardContent className="pt-4">
              <WeeklyChart history={weekHistory} calorieTarget={profile.calorieTarget} />
            </CardContent>
          </Card>
        </section>

        {/* Today's meals */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="type-subheading text-foreground">Today&apos;s Meals</h2>
            <span className="type-micro text-muted-foreground">
              {todayLog.meals.length} logged
            </span>
          </div>

          {todayLog.meals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-8 gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-primary">
                  <Camera size={24} strokeWidth={1.75} />
                </div>
                <p className="type-body text-muted-foreground text-center max-w-[200px]">
                  No meals logged yet. Scan a menu or fridge to get started.
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
                      meal.recommendation === 'good' ? 'bg-primary' : meal.recommendation === 'okay' ? 'bg-feedback-warning' : 'bg-destructive',
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
                      <p className="type-caption text-muted-foreground mt-1 line-clamp-2">{meal.aiAdvice}</p>
                      <span className="type-micro text-muted-foreground mt-1 block">{getTimeLabel(meal.timestamp)}</span>
                    </div>
                    <button
                      onClick={() => removeMeal(meal.id)}
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
