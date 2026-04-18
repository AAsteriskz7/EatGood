'use client';

import { useState } from 'react';
import { useUserProfile } from '@/context/UserProfileContext';
import { calcTDEE, calcMacros, calcBMI, getBMICategory } from '@/context/UserProfileContext';
import type {
  DietPreference, FitnessGoal, ActivityLevel, Sex, ScheduleEvent,
} from '@/context/UserProfileContext';
import {
  User, Target, Beef, Wheat, Droplets, Heart, Shield, Save,
  Flame, Plus, Trash2, Plane, Radio, Users, Dumbbell, Calendar,
  Ruler, Scale, RefreshCw, Bookmark, UtensilsCrossed, MapPin,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

// ─── Option lists ─────────────────────────────────────────────────────────────

const DIET_OPTIONS: { value: DietPreference; label: string }[] = [
  { value: 'any',        label: 'No Restrictions' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan',      label: 'Vegan' },
  { value: 'keto',       label: 'Keto' },
  { value: 'paleo',      label: 'Paleo' },
  { value: 'halal',      label: 'Halal' },
  { value: 'kosher',     label: 'Kosher' },
];

const GOAL_OPTIONS: { value: FitnessGoal; label: string }[] = [
  { value: 'maintain',     label: 'Maintain Weight' },
  { value: 'lose_weight',  label: 'Lose Weight' },
  { value: 'gain_muscle',  label: 'Gain Muscle' },
  { value: 'endurance',    label: 'Endurance' },
  { value: 'heart_health', label: 'Heart Health' },
  { value: 'low_sodium',   label: 'Low Sodium' },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary',   label: 'Sedentary' },
  { value: 'light',       label: 'Light' },
  { value: 'moderate',    label: 'Moderate' },
  { value: 'active',      label: 'Active' },
  { value: 'very_active', label: 'Very Active' },
];

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'male',   label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other',  label: 'Other' },
];

const EVENT_TYPES: { value: ScheduleEvent['type']; label: string; icon: React.ElementType }[] = [
  { value: 'flight',    label: 'Flight',    icon: Plane },
  { value: 'broadcast', label: 'Broadcast', icon: Radio },
  { value: 'meeting',   label: 'Meeting',   icon: Users },
  { value: 'workout',   label: 'Workout',   icon: Dumbbell },
  { value: 'other',     label: 'Other',     icon: Calendar },
];

const EVENT_ICONS: Record<string, React.ElementType> = {
  flight: Plane, broadcast: Radio, meeting: Users, workout: Dumbbell, other: Calendar,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function WeekStat({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
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
  const {
    profile, updateProfile, todayLog, weekHistory, calorieProgress,
    addEvent, removeEvent, todayEvents,
    savedRestaurants, unsaveRestaurant, savedMeals, unsaveMeal,
  } = useUserProfile();

  // Personal & physical
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(String(profile.age ?? ''));
  const [sex, setSex] = useState<Sex | null>(profile.sex);
  const [heightCm, setHeightCm] = useState(String(profile.heightCm ?? ''));
  const [weightKg, setWeightKg] = useState(String(profile.weightKg ?? ''));
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activityLevel);

  // Targets
  const [calorieTarget, setCalorieTarget] = useState(String(profile.calorieTarget));
  const [proteinTarget, setProteinTarget] = useState(String(profile.proteinTarget));
  const [carbTarget, setCarbTarget] = useState(String(profile.carbTarget));
  const [fatTarget, setFatTarget] = useState(String(profile.fatTarget));

  // Preferences
  const [diet, setDiet] = useState<DietPreference>(profile.dietPreference);
  const [goal, setGoal] = useState<FitnessGoal>(profile.fitnessGoal);
  const [allergyInput, setAllergyInput] = useState(profile.allergies.join(', '));
  const [saved, setSaved] = useState(false);

  // Event form
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventType, setEventType] = useState<ScheduleEvent['type']>('meeting');
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));

  // Stats
  const weekTotalCals = weekHistory.reduce((s, d) => s + d.totalCalories, 0);
  const weekAvgCals = weekHistory.length > 0 ? Math.round(weekTotalCals / weekHistory.length) : 0;
  const weekMealCount = weekHistory.reduce((s, d) => s + d.meals.length, 0);

  // Live TDEE preview
  const ageNum = parseInt(age) || null;
  const heightNum = parseFloat(heightCm) || null;
  const weightNum = parseFloat(weightKg) || null;
  const tdee = calcTDEE({ age: ageNum, sex, heightCm: heightNum, weightKg: weightNum, activityLevel });
  const macrosPreview = tdee ? calcMacros(tdee, goal) : null;
  const bmi = heightNum && weightNum ? calcBMI(weightNum, heightNum) : null;
  const bmiCat = bmi ? getBMICategory(bmi) : null;

  const applyAutoTargets = () => {
    if (!macrosPreview) return;
    setCalorieTarget(String(macrosPreview.calories));
    setProteinTarget(String(macrosPreview.proteinG));
    setCarbTarget(String(macrosPreview.carbsG));
    setFatTarget(String(macrosPreview.fatG));
  };

  const handleSave = () => {
    updateProfile({
      name: name.trim(),
      age: ageNum,
      sex,
      heightCm: heightNum,
      weightKg: weightNum,
      activityLevel,
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

  const loadDemoProfile = () => {
    const today = new Date().toISOString().slice(0, 10);
    const nowHour = new Date().getHours();
    const soonTime = `${String(nowHour + 1).padStart(2, '0')}:00`;
    const laterTime = `${String(Math.min(nowHour + 3, 23)).padStart(2, '0')}:30`;
    const eveningTime = `${String(Math.min(nowHour + 6, 23)).padStart(2, '0')}:00`;

    const demoEvents: Omit<ScheduleEvent, 'id'>[] = [
      { title: 'Red-eye to LAX', time: soonTime, type: 'flight', date: today },
      { title: 'Morning Standup Broadcast', time: laterTime, type: 'broadcast', date: today },
      { title: 'Editorial Team Sync', time: eveningTime, type: 'meeting', date: today },
      { title: 'Hotel Gym Session', time: '20:00', type: 'workout', date: today },
    ];
    profile.schedule.forEach((e) => removeEvent(e.id));
    demoEvents.forEach((e) => addEvent(e));

    setName('Alex Rivera');
    setAge('32');
    setSex('male');
    setHeightCm('180');
    setWeightKg('82');
    setActivityLevel('active');
    setCalorieTarget('2400');
    setProteinTarget('190');
    setCarbTarget('240');
    setFatTarget('75');
    setDiet('any');
    setGoal('gain_muscle');
    setAllergyInput('shellfish');

    updateProfile({
      name: 'Alex Rivera',
      age: 32, sex: 'male', heightCm: 180, weightKg: 82, activityLevel: 'active',
      calorieTarget: 2400, proteinTarget: 190, carbTarget: 240, fatTarget: 75,
      dietPreference: 'any', fitnessGoal: 'gain_muscle', allergies: ['shellfish'],
      setupComplete: true,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddEvent = () => {
    if (!eventTitle.trim() || !eventTime.trim()) return;
    addEvent({ title: eventTitle.trim(), time: eventTime, type: eventType, date: eventDate });
    setEventTitle('');
    setEventTime('');
    setShowEventForm(false);
  };

  const allEvents = [...profile.schedule].sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    return d !== 0 ? d : a.time.localeCompare(b.time);
  });

  return (
    <div className="min-h-screen bg-app">
      {/* ── Hero ── */}
      <div className="bg-card border-b border-border px-screen pt-14 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
            <User size={28} strokeWidth={1.75} className="text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="type-heading text-foreground leading-tight">{profile.name || 'Set Up Profile'}</h1>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="type-micro uppercase tracking-wider">
                {DIET_OPTIONS.find((d) => d.value === profile.dietPreference)?.label}
              </Badge>
              <Badge variant="secondary" className="type-micro uppercase tracking-wider">
                {GOAL_OPTIONS.find((g) => g.value === profile.fitnessGoal)?.label}
              </Badge>
              {bmiCat && (
                <Badge variant="secondary" className={['type-micro', bmiCat.token].join(' ')}>
                  BMI {bmi?.toFixed(1)} · {bmiCat.label}
                </Badge>
              )}
            </div>
          </div>
        </div>

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

      <div className="px-screen py-5 flex flex-col gap-section pb-nav">

        {/* ── Schedule ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="type-micro text-muted-foreground uppercase tracking-widest">Schedule</p>
            <button
              onClick={() => setShowEventForm(!showEventForm)}
              aria-label="Add schedule event"
              className="flex items-center gap-1 type-caption text-primary font-semibold active:opacity-70"
            >
              <Plus size={14} strokeWidth={2} />
              Add Event
            </button>
          </div>

          {showEventForm && (
            <Card className="mb-3 animate-fade-up">
              <CardContent className="pt-4 flex flex-col gap-3">
                <Input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="Event name (e.g. Red-eye to LAX)" />
                <div className="grid grid-cols-2 gap-cols">
                  <div>
                    <label className="type-micro text-muted-foreground mb-1 block">Time</label>
                    <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
                  </div>
                  <div>
                    <label className="type-micro text-muted-foreground mb-1 block">Date</label>
                    <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="type-micro text-muted-foreground mb-2 block">Type</label>
                  <div className="flex flex-wrap gap-2">
                    {EVENT_TYPES.map((et) => (
                      <button
                        key={et.value}
                        onClick={() => setEventType(et.value)}
                        className={[
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg type-micro transition-colors',
                          eventType === et.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-border',
                        ].join(' ')}
                      >
                        <et.icon size={12} strokeWidth={2} />
                        {et.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddEvent} variant="default" className="flex-1">Add</Button>
                  <Button onClick={() => setShowEventForm(false)} variant="secondary">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {allEvents.length > 0 ? (
            <Card>
              <CardContent className="px-inner py-0 divide-y divide-border">
                {allEvents.map((evt) => {
                  const EvtIcon = EVENT_ICONS[evt.type] || Calendar;
                  const isToday = evt.date === new Date().toISOString().slice(0, 10);
                  return (
                    <div key={evt.id} className="flex items-center gap-3 py-3.5">
                      <div className={['w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', isToday ? 'bg-primary/10' : 'bg-muted'].join(' ')}>
                        <EvtIcon size={16} strokeWidth={1.75} className={isToday ? 'text-primary' : 'text-muted-foreground'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="type-label text-foreground">{evt.title}</p>
                        <p className="type-micro text-muted-foreground">
                          {evt.time} · {evt.date === new Date().toISOString().slice(0, 10) ? 'Today' : evt.date} · {evt.type}
                        </p>
                      </div>
                      <button
                        onClick={() => removeEvent(evt.id)}
                        aria-label={`Remove event: ${evt.title}`}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted active:bg-destructive/10 transition-colors"
                      >
                        <Trash2 size={14} strokeWidth={1.75} className="text-muted-foreground" />
                      </button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-6 gap-2">
                <Calendar size={24} strokeWidth={1.75} className="text-muted-foreground" />
                <p className="type-caption text-muted-foreground text-center">
                  No events scheduled. Add flights, broadcasts, or meetings to get fatigue-adjusted recommendations.
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* ── Personal ── */}
        <section>
          <p className="type-micro text-muted-foreground uppercase tracking-widest px-1 mb-3">Personal</p>
          <Card>
            <CardContent className="pt-4">
              <label className="type-micro text-muted-foreground mb-1 block">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </CardContent>
          </Card>
        </section>

        {/* ── Physical Stats ── */}
        <section>
          <p className="type-micro text-muted-foreground uppercase tracking-widest px-1 mb-3">Physical Stats</p>
          <Card>
            <CardContent className="pt-4 flex flex-col gap-list">
              <div>
                <label className="type-micro text-muted-foreground mb-2 block flex items-center gap-1">
                  <User size={12} strokeWidth={2} /> Biological sex
                </label>
                <div className="flex gap-2">
                  {SEX_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSex(opt.value)}
                      className={[
                        'flex-1 py-2 rounded-xl type-label border transition-colors',
                        sex === opt.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-foreground border-transparent hover:border-border',
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
                  <label className="type-micro text-muted-foreground mb-1 flex items-center gap-1">
                    <Ruler size={12} strokeWidth={2} /> Height (cm)
                  </label>
                  <Input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="175" />
                </div>
                <div>
                  <label className="type-micro text-muted-foreground mb-1 flex items-center gap-1">
                    <Scale size={12} strokeWidth={2} /> Weight (kg)
                  </label>
                  <Input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="75" />
                </div>
              </div>
              {bmi && bmiCat && (
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <span className="type-micro text-muted-foreground">BMI:</span>
                  <span className={['type-label font-semibold', bmiCat.token].join(' ')}>{bmi.toFixed(1)}</span>
                  <Badge variant="secondary" className="type-micro">{bmiCat.label}</Badge>
                </div>
              )}
              <div>
                <label className="type-micro text-muted-foreground mb-2 block">Activity level</label>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setActivityLevel(opt.value)}
                      className={[
                        'px-3 py-1.5 rounded-lg type-micro transition-colors border',
                        activityLevel === opt.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-transparent hover:border-border',
                      ].join(' ')}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {tdee && (
                <p className="type-caption text-muted-foreground">
                  Estimated TDEE: ~{tdee} kcal/day
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ── Diet ── */}
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
                      diet === opt.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-border',
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── Fitness Goal ── */}
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
                      goal === opt.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-border',
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── Daily Targets ── */}
        <section>
          <div className="flex items-center justify-between px-1 mb-3">
            <p className="type-micro text-muted-foreground uppercase tracking-widest">Daily Targets</p>
            {macrosPreview && (
              <button
                onClick={applyAutoTargets}
                className="flex items-center gap-1 type-caption text-primary font-semibold active:opacity-70"
              >
                <RefreshCw size={12} strokeWidth={2} />
                Auto-calculate
              </button>
            )}
          </div>
          {macrosPreview && (
            <p className="type-caption text-muted-foreground px-1 mb-3">
              Tap &quot;Auto-calculate&quot; to apply targets based on your physical stats and goal.
            </p>
          )}
          <Card>
            <CardContent className="pt-4 flex flex-col gap-list">
              <div className="grid grid-cols-2 gap-cols">
                <div>
                  <label className="type-micro text-muted-foreground mb-1 flex items-center gap-1">
                    <Flame size={12} strokeWidth={2} /> Calories (kcal)
                  </label>
                  <Input type="number" value={calorieTarget} onChange={(e) => setCalorieTarget(e.target.value)} min={500} max={10000} aria-label="Daily calorie target" />
                </div>
                <div>
                  <label className="type-micro text-muted-foreground mb-1 flex items-center gap-1">
                    <Beef size={12} strokeWidth={2} /> Protein (g)
                  </label>
                  <Input type="number" value={proteinTarget} onChange={(e) => setProteinTarget(e.target.value)} min={10} max={500} aria-label="Daily protein target" />
                </div>
                <div>
                  <label className="type-micro text-muted-foreground mb-1 flex items-center gap-1">
                    <Wheat size={12} strokeWidth={2} /> Carbs (g)
                  </label>
                  <Input type="number" value={carbTarget} onChange={(e) => setCarbTarget(e.target.value)} min={10} max={1000} aria-label="Daily carbs target" />
                </div>
                <div>
                  <label className="type-micro text-muted-foreground mb-1 flex items-center gap-1">
                    <Droplets size={12} strokeWidth={2} /> Fat (g)
                  </label>
                  <Input type="number" value={fatTarget} onChange={(e) => setFatTarget(e.target.value)} min={10} max={500} aria-label="Daily fat target" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── Allergies ── */}
        <section>
          <p className="type-micro text-muted-foreground uppercase tracking-widest px-1 mb-3">Allergies</p>
          <Card>
            <CardContent className="pt-4">
              <label className="type-micro text-muted-foreground mb-1 flex items-center gap-1">
                <Shield size={12} strokeWidth={2} /> Allergies (comma separated)
              </label>
              <Input value={allergyInput} onChange={(e) => setAllergyInput(e.target.value)} placeholder="e.g. peanuts, shellfish, dairy" aria-label="Food allergies" />
            </CardContent>
          </Card>
        </section>

        {/* ── Saved Favorites ── */}
        {(savedRestaurants.length > 0 || savedMeals.length > 0) && (
          <section>
            <p className="type-micro text-muted-foreground uppercase tracking-widest px-1 mb-3">Saved</p>

            {savedRestaurants.length > 0 && (
              <div className="mb-list">
                <p className="type-caption text-muted-foreground px-1 mb-2 flex items-center gap-1">
                  <MapPin size={12} strokeWidth={2} /> Restaurants ({savedRestaurants.length})
                </p>
                <Card>
                  <CardContent className="px-inner py-0 divide-y divide-border">
                    {savedRestaurants.map((r) => (
                      <div key={r.id} className="flex items-center gap-3 py-3.5">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                          <MapPin size={14} strokeWidth={1.75} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="type-label text-foreground">{r.name}</p>
                          <p className="type-micro text-muted-foreground line-clamp-1">{r.reason}</p>
                        </div>
                        <button
                          onClick={() => unsaveRestaurant(r.id)}
                          aria-label={`Remove ${r.name} from saved`}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted active:bg-destructive/10 transition-colors"
                        >
                          <Bookmark size={14} strokeWidth={1.75} className="text-primary fill-primary" />
                        </button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {savedMeals.length > 0 && (
              <div>
                <p className="type-caption text-muted-foreground px-1 mb-2 flex items-center gap-1">
                  <UtensilsCrossed size={12} strokeWidth={2} /> Meals ({savedMeals.length})
                </p>
                <Card>
                  <CardContent className="px-inner py-0 divide-y divide-border">
                    {savedMeals.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 py-3.5">
                        <div className={[
                          'w-2 h-2 rounded-full flex-shrink-0',
                          m.recommendation === 'good' ? 'bg-primary' : m.recommendation === 'okay' ? 'bg-feedback-warning' : 'bg-destructive',
                        ].join(' ')} />
                        <div className="flex-1 min-w-0">
                          <p className="type-label text-foreground">{m.name}</p>
                          <p className="type-micro text-muted-foreground">{m.calories} kcal · {m.protein}g P</p>
                        </div>
                        <button
                          onClick={() => unsaveMeal(m.id)}
                          aria-label={`Remove ${m.name} from saved meals`}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted active:bg-destructive/10 transition-colors"
                        >
                          <Bookmark size={14} strokeWidth={1.75} className="text-primary fill-primary" />
                        </button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </section>
        )}

        {/* ── Demo / Save ── */}
        <div className="flex flex-col gap-3">
          <Button onClick={loadDemoProfile} variant="secondary" className="w-full h-12 border-2 border-primary/20 text-primary">
            Load Demo Profile (Hackathon)
          </Button>
          <Button onClick={handleSave} variant="default" className="w-full h-12">
            <Save size={18} strokeWidth={2} className="mr-2" />
            {saved ? 'Saved!' : 'Save Profile'}
          </Button>
        </div>

        <p className="type-micro text-muted-foreground text-center mb-2">
          AnchorFuel v2.0.0 · Data stored locally
        </p>
      </div>
    </div>
  );
}
