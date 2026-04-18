/** Local shapes (avoid importing UserProfileContext → circular dependency) */
type DemoMealEntry = {
  id: string;
  timestamp: number;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  recommendation: 'good' | 'okay' | 'avoid';
  aiAdvice: string;
  imageDataUrl?: string;
};

export type DemoScheduleEvent = {
  id: string;
  title: string;
  time: string;
  type: 'flight' | 'broadcast' | 'meeting' | 'workout' | 'other';
  date: string;
};

type DemoWeightEntry = { date: string; weightKg: number };

type DemoSavedRestaurant = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  recommendation: string;
  reason: string;
  savedAt: number;
};

type DemoSavedMeal = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  recommendation: 'good' | 'okay' | 'avoid';
  savedAt: number;
};

/** Form field defaults for Profile UI after loading demo (strings match controlled inputs) */
export const ALEX_DEMO_FORM = {
  name: 'Alex Rivera',
  age: '32',
  heightCm: '180',
  weightKg: '82',
  calorieTarget: '2400',
  proteinTarget: '190',
  carbTarget: '240',
  fatTarget: '75',
  allergyInput: 'shellfish',
} as const;

export const ALEX_SEX = 'male' as const;
export const ALEX_ACTIVITY = 'active' as const;
export const ALEX_GOAL = 'gain_muscle' as const;
export const ALEX_DIET = 'any' as const;

function dayTimestamp(dateKey: string, hour: number, minute = 0): number {
  return new Date(
    `${dateKey}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`,
  ).getTime();
}

function meal(
  dateKey: string,
  hour: number,
  minute: number,
  data: Omit<DemoMealEntry, 'id' | 'timestamp'>,
  slug: string,
): DemoMealEntry {
  return {
    ...data,
    id: `demo_${dateKey}_${slug}`,
    timestamp: dayTimestamp(dateKey, hour, minute),
  };
}

function formatDateOffset(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

/** Today’s schedule uses rolling times like the hackathon demo */
export function buildAlexSchedule(today: string, nowHour: number): DemoScheduleEvent[] {
  const soonTime = `${String(Math.min(nowHour + 1, 23)).padStart(2, '0')}:00`;
  const laterTime = `${String(Math.min(nowHour + 3, 23)).padStart(2, '0')}:30`;
  const eveningTime = `${String(Math.min(nowHour + 6, 23)).padStart(2, '0')}:00`;
  return [
    { id: 'demo_evt_1', title: 'Red-eye to LAX', time: soonTime, type: 'flight', date: today },
    { id: 'demo_evt_2', title: 'Morning standup broadcast', time: laterTime, type: 'broadcast', date: today },
    { id: 'demo_evt_3', title: 'Editorial team sync', time: eveningTime, type: 'meeting', date: today },
    { id: 'demo_evt_4', title: 'Hotel gym session', time: '20:00', type: 'workout', date: today },
  ];
}

/** Seven days of logged meals so dashboard / profile week stats look alive */
export function buildAlexMealsByDate(): Record<string, DemoMealEntry[]> {
  const out: Record<string, DemoMealEntry[]> = {};

  const plans: { offset: number; meals: Omit<DemoMealEntry, 'id' | 'timestamp'>[]; times: [number, number][] }[] = [
    {
      offset: 0,
      times: [[7, 30], [12, 45], [16, 10]],
      meals: [
        {
          description: 'Oatmeal, berries & whey',
          calories: 428,
          protein: 34,
          carbs: 48,
          fat: 11,
          recommendation: 'good',
          aiAdvice: 'Solid protein anchor for travel mornings.',
        },
        {
          description: 'Grilled chicken rice bowl (airport)',
          calories: 812,
          protein: 52,
          carbs: 78,
          fat: 28,
          recommendation: 'okay',
          aiAdvice: 'Sauce adds fat — still fits a training day.',
        },
        {
          description: 'Greek yogurt + honey',
          calories: 184,
          protein: 17,
          carbs: 22,
          fat: 4,
          recommendation: 'good',
          aiAdvice: 'Quick protein between gates.',
        },
      ],
    },
    {
      offset: 1,
      times: [[8, 0], [13, 15], [19, 30], [21, 0]],
      meals: [
        {
          description: 'Egg white omelet & sourdough',
          calories: 512,
          protein: 38,
          carbs: 42,
          fat: 18,
          recommendation: 'good',
          aiAdvice: 'Balanced hotel breakfast.',
        },
        {
          description: 'Sushi combo (no shellfish)',
          calories: 718,
          protein: 44,
          carbs: 86,
          fat: 18,
          recommendation: 'okay',
          aiAdvice: 'Carb-heavy — fine on a volume day.',
        },
        {
          description: 'Protein bar',
          calories: 220,
          protein: 20,
          carbs: 22,
          fat: 8,
          recommendation: 'good',
          aiAdvice: 'Grab-and-go between meetings.',
        },
        {
          description: 'Casein shake',
          calories: 198,
          protein: 28,
          carbs: 8,
          fat: 6,
          recommendation: 'good',
          aiAdvice: 'Slow protein before sleep.',
        },
      ],
    },
    {
      offset: 2,
      times: [[7, 15], [12, 30], [18, 45]],
      meals: [
        {
          description: 'Breakfast burrito',
          calories: 640,
          protein: 32,
          carbs: 58,
          fat: 30,
          recommendation: 'okay',
          aiAdvice: 'Higher fat — offset elsewhere.',
        },
        {
          description: 'Steak salad',
          calories: 692,
          protein: 48,
          carbs: 22,
          fat: 46,
          recommendation: 'okay',
          aiAdvice: 'Dressing is calorie-dense.',
        },
        {
          description: 'Pasta arrabbiata',
          calories: 782,
          protein: 28,
          carbs: 98,
          fat: 28,
          recommendation: 'okay',
          aiAdvice: 'Carb load; hit protein target with a shake if needed.',
        },
      ],
    },
    {
      offset: 3,
      times: [[8, 30], [13, 0], [20, 15]],
      meals: [
        {
          description: 'Smoked salmon bagel',
          calories: 556,
          protein: 32,
          carbs: 58,
          fat: 24,
          recommendation: 'good',
          aiAdvice: 'Omega-3s and protein.',
        },
        {
          description: 'Turkey clubhouse',
          calories: 598,
          protein: 42,
          carbs: 48,
          fat: 26,
          recommendation: 'good',
          aiAdvice: 'Classic travel lunch.',
        },
        {
          description: 'Stir-fry beef & jasmine rice',
          calories: 884,
          protein: 46,
          carbs: 92,
          fat: 36,
          recommendation: 'okay',
          aiAdvice: 'Oil in the wok adds stealth kcal.',
        },
      ],
    },
    {
      offset: 4,
      times: [[7, 0], [12, 0], [15, 30], [19, 0]],
      meals: [
        {
          description: 'Protein pancakes',
          calories: 468,
          protein: 36,
          carbs: 52,
          fat: 12,
          recommendation: 'good',
          aiAdvice: 'Pre-gym fuel.',
        },
        {
          description: 'Chipotle-style bowl',
          calories: 798,
          protein: 48,
          carbs: 82,
          fat: 32,
          recommendation: 'okay',
          aiAdvice: 'Guac + sour cream stack calories.',
        },
        {
          description: 'Cottage cheese + pineapple',
          calories: 186,
          protein: 22,
          carbs: 18,
          fat: 4,
          recommendation: 'good',
          aiAdvice: 'Casein-friendly snack.',
        },
        {
          description: 'Grilled salmon + potatoes',
          calories: 712,
          protein: 46,
          carbs: 54,
          fat: 34,
          recommendation: 'good',
          aiAdvice: 'Whole-food dinner.',
        },
      ],
    },
    {
      offset: 5,
      times: [[9, 0], [13, 30], [19, 45]],
      meals: [
        {
          description: 'Avocado toast + eggs',
          calories: 524,
          protein: 24,
          carbs: 46,
          fat: 28,
          recommendation: 'okay',
          aiAdvice: 'Healthy fats — watch total fat budget.',
        },
        {
          description: 'Chicken Caesar (light dressing)',
          calories: 618,
          protein: 44,
          carbs: 28,
          fat: 38,
          recommendation: 'okay',
          aiAdvice: 'Ask dressing on the side next time.',
        },
        {
          description: 'Margherita pizza (3 slices)',
          calories: 798,
          protein: 32,
          carbs: 96,
          fat: 28,
          recommendation: 'avoid',
          aiAdvice: 'Blew fat/carbs for the day — balance tomorrow.',
        },
      ],
    },
    {
      offset: 6,
      times: [[8, 45], [12, 15], [18, 30]],
      meals: [
        {
          description: 'Overnight oats',
          calories: 412,
          protein: 28,
          carbs: 54,
          fat: 10,
          recommendation: 'good',
          aiAdvice: 'Fiber + steady carbs.',
        },
        {
          description: 'Banh mi (grilled chicken)',
          calories: 556,
          protein: 36,
          carbs: 62,
          fat: 18,
          recommendation: 'good',
          aiAdvice: 'Portable and balanced.',
        },
        {
          description: 'BBQ plate — brisket & sides',
          calories: 1124,
          protein: 58,
          carbs: 48,
          fat: 76,
          recommendation: 'avoid',
          aiAdvice: 'Event meal — sodium and fat high.',
        },
      ],
    },
  ];

  for (const plan of plans) {
    const dateKey = formatDateOffset(plan.offset);
    const slugs = ['breakfast', 'lunch', 'snack', 'dinner', 'late'];
    out[dateKey] = plan.meals.map((m, i) => {
      const [h, min] = plan.times[i];
      return meal(dateKey, h, min ?? 0, m, slugs[i] ?? `meal_${i}`);
    });
  }

  return out;
}

export function buildAlexWeightLog(): DemoWeightEntry[] {
  const rows: { daysAgo: number; kg: number }[] = [
    { daysAgo: 0, kg: 82.0 },
    { daysAgo: 1, kg: 82.1 },
    { daysAgo: 2, kg: 81.9 },
    { daysAgo: 3, kg: 82.3 },
    { daysAgo: 4, kg: 82.2 },
    { daysAgo: 5, kg: 82.0 },
    { daysAgo: 6, kg: 81.8 },
    { daysAgo: 13, kg: 81.6 },
  ];
  return rows.map((r) => ({
    date: formatDateOffset(r.daysAgo),
    weightKg: r.kg,
  }));
}

export function buildAlexSavedRestaurants(now = Date.now()): DemoSavedRestaurant[] {
  return [
    {
      id: 'demo_rst_lax',
      name: 'Sweetgreen — LAX T4',
      lat: 33.94159,
      lon: -118.40853,
      recommendation: 'good',
      reason: 'Modular bowls; double protein keeps you near target on the road.',
      savedAt: now - 86400000 * 3,
    },
    {
      id: 'demo_rst_santa_monica',
      name: 'Sugarfish — Santa Monica',
      lat: 34.0195,
      lon: -118.4912,
      recommendation: 'okay',
      reason: 'Clean fish; avoid heavy rolls if you need room for a late snack.',
      savedAt: now - 86400000 * 9,
    },
  ];
}

export function buildAlexSavedMeals(now = Date.now()): DemoSavedMeal[] {
  return [
    {
      id: 'demo_sv_bowl',
      name: 'Airport: double chicken rice bowl',
      calories: 812,
      protein: 52,
      carbs: 78,
      fat: 28,
      recommendation: 'okay',
      savedAt: now - 86400000,
    },
    {
      id: 'demo_sv_shake',
      name: 'Hotel: casein night shake',
      calories: 198,
      protein: 28,
      carbs: 8,
      fat: 6,
      recommendation: 'good',
      savedAt: now - 86400000 * 2,
    },
    {
      id: 'demo_sv_oats',
      name: 'Travel breakfast: oats + whey',
      calories: 428,
      protein: 34,
      carbs: 48,
      fat: 11,
      recommendation: 'good',
      savedAt: now - 3600000,
    },
  ];
}
