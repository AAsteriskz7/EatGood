'use client';

import { useState } from 'react';
import { useUserProfile } from '@/context/UserProfileContext';
import type { DietPreference, FitnessGoal } from '@/context/UserProfileContext';
import {
  User,
  Target,
  Beef,
  Wheat,
  Droplets,
  Heart,
  Shield,
  Save,
  Flame,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

// ─── Options ──────────────────────────────────────────────────────────────────

const DIET_OPTIONS: { value: DietPreference; label: string }[] = [
  { value: 'any', label: 'No Restrictions' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
];

const GOAL_OPTIONS: { value: FitnessGoal; label: string }[] = [
  { value: 'maintain', label: 'Maintain Weight' },
  { value: 'lose_weight', label: 'Lose Weight' },
  { value: 'gain_muscle', label: 'Gain Muscle' },
  { value: 'endurance', label: 'Endurance' },
];

// ─── Weekly Stat ──────────────────────────────────────────────────────────────

function WeekStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex-1 flex flex-col items-center gap-2 py-4">
      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary">
        <Icon size={16} strokeWidth={2} />
      </div>
      <p className="type-heading text-foreground leading-none">{value}</p>
      <p className="type-micro text-muted-foreground text-center">{label}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { profile, updateProfile, todayLog, weekHistory, calorieProgress } = useUserProfile();

  const [name, setName] = useState(profile.name);
  const [calorieTarget, setCalorieTarget] = useState(String(profile.calorieTarget));
  const [proteinTarget, setProteinTarget] = useState(String(profile.proteinTarget));
  const [carbTarget, setCarbTarget] = useState(String(profile.carbTarget));
  const [fatTarget, setFatTarget] = useState(String(profile.fatTarget));
  const [diet, setDiet] = useState<DietPreference>(profile.dietPreference);
  const [goal, setGoal] = useState<FitnessGoal>(profile.fitnessGoal);
  const [allergyInput, setAllergyInput] = useState(profile.allergies.join(', '));
  const [saved, setSaved] = useState(false);

  const weekTotalCals = weekHistory.reduce((s, d) => s + d.totalCalories, 0);
  const weekAvgCals = weekHistory.length > 0 ? Math.round(weekTotalCals / weekHistory.length) : 0;
  const weekMealCount = weekHistory.reduce((s, d) => s + d.meals.length, 0);

  const handleSave = () => {
    updateProfile({
      name: name.trim(),
      calorieTarget: parseInt(calorieTarget) || 2000,
      proteinTarget: parseInt(proteinTarget) || 150,
      carbTarget: parseInt(carbTarget) || 200,
      fatTarget: parseInt(fatTarget) || 65,
      dietPreference: diet,
      fitnessGoal: goal,
      allergies: allergyInput.split(',').map((a) => a.trim()).filter(Boolean),
      setupComplete: true,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ── */}
      <div className="bg-card border-b border-border px-screen pt-14 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
            <User size={28} strokeWidth={1.75} className="text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="type-heading text-foreground leading-tight">{profile.name || 'Set Up Profile'}</h1>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="type-micro uppercase tracking-wider">
                {DIET_OPTIONS.find((d) => d.value === profile.dietPreference)?.label}
              </Badge>
              <Badge variant="secondary" className="type-micro uppercase tracking-wider">
                {GOAL_OPTIONS.find((g) => g.value === profile.fitnessGoal)?.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Weekly stats */}
        <div className="mt-5 flex divide-x divide-border bg-muted rounded-xl overflow-hidden">
          <WeekStat label="Avg kcal/day" value={String(weekAvgCals)} icon={Flame} />
          <WeekStat label="Meals logged" value={String(weekMealCount)} icon={Heart} />
          <WeekStat label="Today" value={`${todayLog.totalCalories}`} icon={Target} />
        </div>
      </div>

      {/* ── Today's progress ── */}
      <div className="px-screen pt-5">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="type-label text-foreground font-semibold">Today&apos;s Progress</p>
              <p className="type-micro text-muted-foreground">{Math.round(calorieProgress)}%</p>
            </div>
            <Progress value={calorieProgress} className="h-2" />
            <div className="flex justify-between mt-2">
              <span className="type-micro text-muted-foreground">{todayLog.totalCalories} consumed</span>
              <span className="type-micro text-muted-foreground">{profile.calorieTarget} target</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Profile Form ── */}
      <div className="px-screen py-5 flex flex-col gap-section pb-nav">

        {/* Personal */}
        <section>
          <p className="type-micro text-muted-foreground uppercase tracking-widest px-1 mb-3">Personal</p>
          <Card>
            <CardContent className="pt-4 flex flex-col gap-list">
              <div>
                <label className="type-micro text-muted-foreground mb-1 block">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Diet */}
        <section>
          <p className="type-micro text-muted-foreground uppercase tracking-widest px-1 mb-3">Diet Preference</p>
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-2">
                {DIET_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDiet(opt.value)}
                    className={[
                      'px-4 py-2 rounded-lg type-label transition-colors',
                      diet === opt.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-border',
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Fitness Goal */}
        <section>
          <p className="type-micro text-muted-foreground uppercase tracking-widest px-1 mb-3">Fitness Goal</p>
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-2">
                {GOAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setGoal(opt.value)}
                    className={[
                      'px-4 py-2 rounded-lg type-label transition-colors',
                      goal === opt.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-border',
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Macro Targets */}
        <section>
          <p className="type-micro text-muted-foreground uppercase tracking-widest px-1 mb-3">Daily Targets</p>
          <Card>
            <CardContent className="pt-4 flex flex-col gap-list">
              <div className="grid grid-cols-2 gap-cols">
                <div>
                  <label className="type-micro text-muted-foreground mb-1 flex items-center gap-1">
                    <Flame size={12} strokeWidth={2} />
                    Calories (kcal)
                  </label>
                  <Input
                    type="number"
                    value={calorieTarget}
                    onChange={(e) => setCalorieTarget(e.target.value)}
                    min={500}
                    max={10000}
                  />
                </div>
                <div>
                  <label className="type-micro text-muted-foreground mb-1 flex items-center gap-1">
                    <Beef size={12} strokeWidth={2} />
                    Protein (g)
                  </label>
                  <Input
                    type="number"
                    value={proteinTarget}
                    onChange={(e) => setProteinTarget(e.target.value)}
                    min={10}
                    max={500}
                  />
                </div>
                <div>
                  <label className="type-micro text-muted-foreground mb-1 flex items-center gap-1">
                    <Wheat size={12} strokeWidth={2} />
                    Carbs (g)
                  </label>
                  <Input
                    type="number"
                    value={carbTarget}
                    onChange={(e) => setCarbTarget(e.target.value)}
                    min={10}
                    max={1000}
                  />
                </div>
                <div>
                  <label className="type-micro text-muted-foreground mb-1 flex items-center gap-1">
                    <Droplets size={12} strokeWidth={2} />
                    Fat (g)
                  </label>
                  <Input
                    type="number"
                    value={fatTarget}
                    onChange={(e) => setFatTarget(e.target.value)}
                    min={10}
                    max={500}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Allergies */}
        <section>
          <p className="type-micro text-muted-foreground uppercase tracking-widest px-1 mb-3">Allergies</p>
          <Card>
            <CardContent className="pt-4">
              <div>
                <label className="type-micro text-muted-foreground mb-1 flex items-center gap-1">
                  <Shield size={12} strokeWidth={2} />
                  Allergies (comma separated)
                </label>
                <Input
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  placeholder="e.g. peanuts, shellfish, dairy"
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Save */}
        <Button onClick={handleSave} variant="default" className="w-full h-12">
          <Save size={18} strokeWidth={2} className="mr-2" />
          {saved ? 'Saved!' : 'Save Profile'}
        </Button>

        <p className="type-micro text-muted-foreground text-center mb-2">
          AnchorFuel v1.0.0 · Data stored locally
        </p>
      </div>
    </div>
  );
}
