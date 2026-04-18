'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/context/UserProfileContext';
import {
  calcTDEE, calcMacros, calcBMI, getBMICategory,
} from '@/context/UserProfileContext';
import type { DietPreference, FitnessGoal, ActivityLevel, Sex } from '@/context/UserProfileContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ChevronRight, ChevronLeft, Check,
  User, Ruler, Target, Leaf, ClipboardList,
  Flame, Beef, Wheat, Droplets,
} from 'lucide-react';

// ─── Step data ─────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'personal',  label: 'Personal',  icon: User },
  { id: 'physical',  label: 'Physical',  icon: Ruler },
  { id: 'goal',      label: 'Goal',      icon: Target },
  { id: 'diet',      label: 'Diet',      icon: Leaf },
  { id: 'review',    label: 'Review',    icon: ClipboardList },
];

const GOAL_OPTIONS: { value: FitnessGoal; label: string; description: string }[] = [
  { value: 'lose_weight',  label: 'Lose Weight',     description: 'Calorie deficit, higher protein' },
  { value: 'gain_muscle',  label: 'Gain Muscle',     description: 'Calorie surplus, protein-forward' },
  { value: 'maintain',     label: 'Maintain',        description: 'Balanced macros at TDEE' },
  { value: 'endurance',    label: 'Endurance',       description: 'Higher carbs for sustained energy' },
  { value: 'heart_health', label: 'Heart Health',    description: 'Healthy fats, lower sodium' },
  { value: 'low_sodium',   label: 'Low Sodium',      description: 'Limit processed and salty foods' },
];

const DIET_OPTIONS: { value: DietPreference; label: string }[] = [
  { value: 'any',         label: 'No Restrictions' },
  { value: 'vegetarian',  label: 'Vegetarian' },
  { value: 'vegan',       label: 'Vegan' },
  { value: 'keto',        label: 'Keto' },
  { value: 'paleo',       label: 'Paleo' },
  { value: 'halal',       label: 'Halal' },
  { value: 'kosher',      label: 'Kosher' },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; sub: string }[] = [
  { value: 'sedentary',   label: 'Sedentary',     sub: 'Desk job, little or no exercise' },
  { value: 'light',       label: 'Lightly Active', sub: '1–3 days/week exercise' },
  { value: 'moderate',    label: 'Moderately Active', sub: '3–5 days/week exercise' },
  { value: 'active',      label: 'Active',        sub: '6–7 days/week exercise' },
  { value: 'very_active', label: 'Very Active',   sub: 'Physical job or 2× daily training' },
];

// ─── Pill button helper ────────────────────────────────────────────────────────

function PillOption<T extends string>({
  value, label, selected, onSelect, sub,
}: {
  value: T; label: string; selected: boolean; onSelect: (v: T) => void; sub?: string;
}) {
  return (
    <button
      onClick={() => onSelect(value)}
      className={[
        'w-full text-left px-4 py-3 rounded-xl type-label transition-colors border',
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-muted text-foreground border-transparent hover:border-border',
      ].join(' ')}
    >
      <div className="flex items-center justify-between">
        <span>{label}</span>
        {selected && <Check size={14} strokeWidth={2.5} />}
      </div>
      {sub && <p className={['type-micro mt-0.5', selected ? 'text-primary-foreground/70' : 'text-muted-foreground'].join(' ')}>{sub}</p>}
    </button>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { updateProfile, logWeight } = useUserProfile();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<Sex | null>(null);
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<FitnessGoal>('maintain');
  const [diet, setDiet] = useState<DietPreference>('any');
  const [allergyInput, setAllergyInput] = useState('');

  const ageNum = parseInt(age) || null;
  const heightNum = parseFloat(heightCm) || null;
  const weightNum = parseFloat(weightKg) || null;

  const tdee = calcTDEE({ age: ageNum, sex, heightCm: heightNum, weightKg: weightNum, activityLevel });
  const macros = tdee ? calcMacros(tdee, goal) : null;
  const bmi = heightNum && weightNum ? calcBMI(weightNum, heightNum) : null;
  const bmiCat = bmi ? getBMICategory(bmi) : null;

  const canProceed = [
    () => name.trim().length > 0,
    () => !!ageNum && ageNum > 10 && ageNum < 120 && !!sex && !!heightNum && heightNum > 50 && !!weightNum && weightNum > 20,
    () => true,
    () => true,
    () => true,
  ][step]();

  const handleFinish = () => {
    updateProfile({
      name: name.trim(),
      age: ageNum,
      sex,
      heightCm: heightNum,
      weightKg: weightNum,
      activityLevel,
      fitnessGoal: goal,
      dietPreference: diet,
      allergies: allergyInput.split(',').map((a) => a.trim()).filter(Boolean),
      calorieTarget: macros?.calories ?? 2000,
      proteinTarget: macros?.proteinG ?? 150,
      carbTarget: macros?.carbsG ?? 200,
      fatTarget: macros?.fatG ?? 65,
      targetsAutoCalculated: !!macros,
      setupComplete: true,
    });
    if (weightNum) logWeight(weightNum);
    router.push('/dashboard');
  };

  const SEX_OPTIONS: { value: Sex; label: string }[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="min-h-screen bg-app flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2 px-screen pt-8 pb-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const active = i === step;
          return (
            <div key={s.id} className="flex items-center gap-1">
              <div className={[
                'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                done ? 'bg-primary' : active ? 'bg-primary/20' : 'bg-muted',
              ].join(' ')}>
                {done
                  ? <Check size={14} strokeWidth={2.5} className="text-primary-foreground" />
                  : <Icon size={14} strokeWidth={1.75} className={active ? 'text-primary' : 'text-muted-foreground'} />
                }
              </div>
              {i < STEPS.length - 1 && (
                <div className={['w-4 h-px', i < step ? 'bg-primary' : 'bg-border'].join(' ')} />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex-1 flex flex-col px-screen py-6 gap-section overflow-y-auto">

        {/* ── Step 0: Personal ── */}
        {step === 0 && (
          <div className="flex flex-col gap-list animate-fade-up">
            <div>
              <h1 className="type-display text-foreground">Welcome to AnchorFuel</h1>
              <p className="type-body text-muted-foreground mt-2">Let&apos;s set up your health profile. This takes about 60 seconds.</p>
            </div>
            <Card>
              <CardContent className="pt-4">
                <label className="type-micro text-muted-foreground mb-1 block">Your name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="First name or nickname"
                  autoFocus
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Step 1: Physical Stats ── */}
        {step === 1 && (
          <div className="flex flex-col gap-list animate-fade-up">
            <div>
              <h1 className="type-heading text-foreground">Physical stats</h1>
              <p className="type-body text-muted-foreground mt-1">Used to calculate your calorie needs and BMI. Stored locally on your device.</p>
            </div>
            <Card>
              <CardContent className="pt-4 flex flex-col gap-list">
                <div>
                  <label className="type-micro text-muted-foreground mb-2 block">Biological sex</label>
                  <div className="flex gap-2">
                    {SEX_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSex(opt.value)}
                        className={[
                          'flex-1 py-2.5 rounded-xl type-label border transition-colors',
                          sex === opt.value
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted text-foreground border-transparent hover:border-border',
                        ].join(' ')}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-cols">
                  <div>
                    <label className="type-micro text-muted-foreground mb-1 block">Age</label>
                    <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="30" min={10} max={120} />
                  </div>
                  <div>
                    <label className="type-micro text-muted-foreground mb-1 block">Height (cm)</label>
                    <Input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="175" min={50} max={250} />
                  </div>
                  <div>
                    <label className="type-micro text-muted-foreground mb-1 block">Weight (kg)</label>
                    <Input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="75" min={20} max={300} />
                  </div>
                </div>
                {bmi && bmiCat && (
                  <div className="flex items-center gap-2 pt-1 border-t border-border">
                    <span className="type-micro text-muted-foreground">BMI:</span>
                    <span className={['type-label font-semibold', bmiCat.token].join(' ')}>{bmi.toFixed(1)}</span>
                    <Badge variant="secondary" className="type-micro">{bmiCat.label}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 flex flex-col gap-list">
                <p className="type-micro text-muted-foreground uppercase tracking-widest">Activity level</p>
                {ACTIVITY_OPTIONS.map((opt) => (
                  <PillOption key={opt.value} value={opt.value} label={opt.label} sub={opt.sub} selected={activityLevel === opt.value} onSelect={setActivityLevel} />
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Step 2: Goal ── */}
        {step === 2 && (
          <div className="flex flex-col gap-list animate-fade-up">
            <div>
              <h1 className="type-heading text-foreground">Your primary goal</h1>
              <p className="type-body text-muted-foreground mt-1">This determines your calorie target and macro ratios.</p>
            </div>
            <div className="flex flex-col gap-2">
              {GOAL_OPTIONS.map((opt) => (
                <PillOption key={opt.value} value={opt.value} label={opt.label} sub={opt.description} selected={goal === opt.value} onSelect={setGoal} />
              ))}
            </div>
            {macros && (
              <Card className="border-primary/20">
                <CardContent className="pt-4">
                  <p className="type-micro text-muted-foreground mb-3">Estimated daily targets for your goal:</p>
                  <div className="grid grid-cols-2 gap-cols">
                    <div className="flex items-center gap-2">
                      <Flame size={14} strokeWidth={2} className="text-primary" />
                      <span className="type-label text-foreground">{macros.calories} kcal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Beef size={14} strokeWidth={2} className="text-primary" />
                      <span className="type-label text-foreground">{macros.proteinG}g protein</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wheat size={14} strokeWidth={2} className="text-primary" />
                      <span className="type-label text-foreground">{macros.carbsG}g carbs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Droplets size={14} strokeWidth={2} className="text-primary" />
                      <span className="type-label text-foreground">{macros.fatG}g fat</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── Step 3: Diet & Allergies ── */}
        {step === 3 && (
          <div className="flex flex-col gap-list animate-fade-up">
            <div>
              <h1 className="type-heading text-foreground">Diet & allergies</h1>
              <p className="type-body text-muted-foreground mt-1">Used to filter recommendations and flag unsafe foods.</p>
            </div>
            <Card>
              <CardContent className="pt-4 flex flex-col gap-list">
                <p className="type-micro text-muted-foreground uppercase tracking-widest">Diet preference</p>
                <div className="flex flex-wrap gap-2">
                  {DIET_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDiet(opt.value)}
                      className={[
                        'px-4 py-2 rounded-xl type-label border transition-colors',
                        diet === opt.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted text-foreground border-transparent hover:border-border',
                      ].join(' ')}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <label className="type-micro text-muted-foreground mb-1 block">Allergies or intolerances (comma separated)</label>
                <Input
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  placeholder="e.g. peanuts, shellfish, dairy"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Step 4: Review ── */}
        {step === 4 && (
          <div className="flex flex-col gap-list animate-fade-up">
            <div>
              <h1 className="type-heading text-foreground">Review & confirm</h1>
              <p className="type-body text-muted-foreground mt-1">Everything looks good? You can update these anytime in your profile.</p>
            </div>

            <Card>
              <CardContent className="pt-4 flex flex-col gap-list divide-y divide-border">
                <ReviewRow label="Name" value={name || '—'} />
                <ReviewRow label="Age" value={ageNum ? `${ageNum} years` : '—'} />
                <ReviewRow label="Sex" value={sex ?? '—'} />
                <ReviewRow label="Height" value={heightNum ? `${heightNum} cm` : '—'} />
                <ReviewRow label="Weight" value={weightNum ? `${weightNum} kg` : '—'} />
                <ReviewRow label="Activity" value={ACTIVITY_OPTIONS.find((a) => a.value === activityLevel)?.label ?? '—'} />
                <ReviewRow label="Goal" value={GOAL_OPTIONS.find((g) => g.value === goal)?.label ?? '—'} />
                <ReviewRow label="Diet" value={DIET_OPTIONS.find((d) => d.value === diet)?.label ?? '—'} />
                {allergyInput.trim() && <ReviewRow label="Allergies" value={allergyInput} />}
              </CardContent>
            </Card>

            {bmi && bmiCat && (
              <Card className="border-primary/20">
                <CardContent className="pt-4">
                  <p className="type-micro text-muted-foreground uppercase tracking-widest mb-3">Calculated metrics</p>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="type-label text-muted-foreground">BMI</span>
                    <span className={['type-heading', bmiCat.token].join(' ')}>{bmi.toFixed(1)}</span>
                    <Badge variant="secondary">{bmiCat.label}</Badge>
                  </div>
                  {tdee && <p className="type-caption text-muted-foreground">TDEE: ~{tdee} kcal/day</p>}
                </CardContent>
              </Card>
            )}

            {macros && (
              <Card>
                <CardContent className="pt-4">
                  <p className="type-micro text-muted-foreground uppercase tracking-widest mb-3">Daily targets</p>
                  <div className="grid grid-cols-2 gap-cols">
                    <div className="flex items-center gap-2">
                      <Flame size={14} strokeWidth={2} className="text-primary" />
                      <span className="type-label text-foreground">{macros.calories} kcal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Beef size={14} strokeWidth={2} className="text-primary" />
                      <span className="type-label text-foreground">{macros.proteinG}g protein</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wheat size={14} strokeWidth={2} className="text-primary" />
                      <span className="type-label text-foreground">{macros.carbsG}g carbs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Droplets size={14} strokeWidth={2} className="text-primary" />
                      <span className="type-label text-foreground">{macros.fatG}g fat</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

      </div>

      {/* Navigation footer */}
      <div className="px-screen pb-8 pt-4 flex gap-3 border-t border-border bg-app" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}>
        {step > 0 && (
          <Button
            onClick={() => setStep((s) => s - 1)}
            variant="secondary"
            className="h-12 px-5"
            aria-label="Go to previous step"
          >
            <ChevronLeft size={18} strokeWidth={2} />
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            variant="default"
            disabled={!canProceed}
            className="flex-1 h-12"
          >
            Continue
            <ChevronRight size={18} strokeWidth={2} className="ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            variant="default"
            className="flex-1 h-12"
          >
            <Check size={18} strokeWidth={2} className="mr-2" />
            Start tracking
          </Button>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
      <span className="type-caption text-muted-foreground">{label}</span>
      <span className="type-label text-foreground capitalize">{value}</span>
    </div>
  );
}
