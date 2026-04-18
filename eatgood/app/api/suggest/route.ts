import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = anthropicApiKey ? new Anthropic({ apiKey: anthropicApiKey }) : null;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

interface SuggestResponse {
  nearbyOptions: Array<{
    venue: string;
    distance: string;
    recommendation: string;
    reason: string;
    estimatedCalories: number;
    estimatedProtein: number;
    type: 'good' | 'okay' | 'avoid';
  }>;
  microInterventions: Array<{
    title: string;
    duration: string;
    description: string;
    type: 'movement' | 'breathing' | 'hydration' | 'rest';
  }>;
  mealTimingAdvice: {
    nextMealIn: string;
    mealType: 'light' | 'moderate' | 'heavy' | 'snack';
    reason: string;
  };
  proactiveAlert: string;
}

function buildFallbackSuggestions(
  remainingCalories: number,
  remainingProtein: number,
  goalLabel: string
): SuggestResponse {
  const isLowBudget = remainingCalories < 450;
  const isHighProteinNeed = remainingProtein > 35;

  return {
    nearbyOptions: [
      {
        venue: 'Subway',
        distance: '6 min walk',
        recommendation: isHighProteinNeed ? '6" turkey sub, extra veggies, no mayo' : '6" veggie sub with lean protein add-on',
        reason: `Supports a ${goalLabel} plan while staying within your remaining ${remainingCalories} kcal budget.`,
        estimatedCalories: 360,
        estimatedProtein: 24,
        type: 'good',
      },
      {
        venue: 'Starbucks',
        distance: '4 min walk',
        recommendation: isLowBudget ? 'Egg white bites + unsweetened iced coffee' : 'Turkey bacon sandwich + cold brew',
        reason: `Convenient option to add protein without overshooting your remaining ${remainingCalories} kcal.`,
        estimatedCalories: isLowBudget ? 230 : 390,
        estimatedProtein: isLowBudget ? 13 : 23,
        type: 'okay',
      },
      {
        venue: 'McDonald\'s',
        distance: '8 min walk',
        recommendation: 'Grilled-style lean option if available, skip fries and sugary drinks',
        reason: `Easy to overeat here, so choose portion-controlled items to protect your remaining ${remainingCalories} kcal.`,
        estimatedCalories: 520,
        estimatedProtein: 20,
        type: isLowBudget ? 'avoid' : 'okay',
      },
    ],
    microInterventions: [
      {
        title: '2-minute hydration reset',
        duration: '2 min',
        description: 'Drink 300-500 ml water now to reduce fatigue-driven snacking and improve focus.',
        type: 'hydration',
      },
      {
        title: 'Desk or gate mobility flow',
        duration: '5 min',
        description: 'Do neck, hip, and calf mobility to reduce stiffness and improve energy before your next meal.',
        type: 'movement',
      },
    ],
    mealTimingAdvice: {
      nextMealIn: isLowBudget ? '60-90 minutes' : '30-45 minutes',
      mealType: isLowBudget ? 'snack' : 'light',
      reason: `With ${remainingCalories} kcal and ${remainingProtein}g protein left, prioritize a protein-forward meal without extra liquid calories.`,
    },
    proactiveAlert: `Quick win: choose a protein-first meal in the next hour to stay aligned with your ${goalLabel} target.`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { latitude, longitude, userProfile, schedule, currentTime } = body;
    const lat = Number(latitude);
    const lon = Number(longitude);
    const hasValidLocation = Number.isFinite(lat) && Number.isFinite(lon);

    const dietLabel = userProfile?.dietPreference === 'any' ? 'no dietary restrictions' : userProfile?.dietPreference;
    const goalLabel = userProfile?.fitnessGoal?.replace('_', ' ') || 'maintain weight';
    const calorieTarget = userProfile?.calorieTarget ?? 2000;
    const remainingCalories = userProfile?.remainingCalories ?? calorieTarget;
    const proteinTarget = userProfile?.proteinTarget ?? 150;
    const remainingProtein = userProfile?.remainingProtein ?? proteinTarget;
    const allergies = userProfile?.allergies?.length ? userProfile.allergies.join(', ') : 'none';

    // Build schedule context
    let scheduleContext = 'No upcoming events scheduled.';
    if (schedule && schedule.length > 0) {
      scheduleContext = 'Upcoming schedule:\n' + schedule.map((e: { title: string; time: string; type: string }) =>
        `- ${e.title} at ${e.time} (${e.type})`
      ).join('\n');
    }

    // Determine fatigue level based on schedule density and time
    const hour = new Date(currentTime || Date.now()).getHours();
    let fatigueContext = '';
    if (hour >= 22 || hour < 5) {
      fatigueContext = 'The user is likely fatigued (late night / very early morning). Prioritize easy, light meals that aid sleep. Suggest calming micro-interventions.';
    } else if (hour >= 5 && hour < 7) {
      fatigueContext = 'Early morning — the user may be running on low sleep. Suggest energizing but not heavy options.';
    } else if (schedule && schedule.length >= 3) {
      fatigueContext = 'The user has a packed schedule today. They are likely operating under high cognitive load. Suggest efficient, macro-dense meals that do not cause crashes.';
    }

    const fallback = buildFallbackSuggestions(remainingCalories, remainingProtein, goalLabel);
    if (!hasValidLocation) {
      return NextResponse.json(fallback);
    }

    const systemPrompt = `You are AnchorFuel, a proactive AI health coach for traveling professionals (journalists, correspondents, field crews). You act BEFORE the user has to ask. Based on location, schedule, and time of day, return practical recommendations.

1. NEARBY FOOD SUGGESTIONS: Suggest exactly 4 realistic nearby food options (well-known chains or venue types likely around the provided coordinates). Each option must include a specific menu item.

2. MICRO-INTERVENTIONS: Based on their schedule and fatigue level, suggest 1-2 brief physical or mental wellness actions (5-10 min mobility stretch, breathing exercise, hydration reminder, short walk) that fit into their schedule gaps.

3. MEAL TIMING ADVICE: Based on their remaining caloric budget and upcoming schedule, advise when they should eat next and what type of meal (heavy, light, snack).

User profile:
- Diet: ${dietLabel}
- Goal: ${goalLabel}
- Daily calorie target: ${calorieTarget} kcal
- Remaining today: ${remainingCalories} kcal
- Protein target: ${proteinTarget}g, remaining: ${remainingProtein}g
- Allergies: ${allergies}

Location: Latitude ${lat}, Longitude ${lon}
Current time: ${currentTime || new Date().toISOString()}
${fatigueContext}

${scheduleContext}

Respond in STRICT JSON format (no markdown, no code fences):
{
  "nearbyOptions": [
    {
      "venue": "Name of restaurant/food spot",
      "distance": "2 min walk",
      "recommendation": "Specific menu item to order",
      "reason": "Why this fits their goals right now",
      "estimatedCalories": 450,
      "estimatedProtein": 30,
      "type": "good"
    }
  ],
  "microInterventions": [
    {
      "title": "Brief intervention name",
      "duration": "5 min",
      "description": "What to do and why",
      "type": "movement" 
    }
  ],
  "mealTimingAdvice": {
    "nextMealIn": "30 minutes",
    "mealType": "light",
    "reason": "Contextual reason based on schedule and remaining budget"
  },
  "proactiveAlert": "One-sentence proactive notification message the user would see, e.g. 'You have a 45-minute gap before your 3 PM call — grab the grilled chicken wrap at the cafe downstairs to hit your protein goal.'"
}

Rules:
- Be SPECIFIC and CONTEXTUAL. Reference their exact remaining calories, their next event, the time of day.
- For nearby options, suggest realistic food venues for the area type (urban, airport, suburban).
- nearbyOptions must contain exactly 4 items. Do not return empty arrays.
- distance must be practical text like "4 min walk" or "6 min drive".
- recommendation must include a concrete menu item, not a generic category.
- Micro-interventions should be doable in a hotel room, airport gate, or office.
- type for micro-interventions: "movement", "breathing", "hydration", "rest"
- type for nearby food: "good", "okay", "avoid"`;

    if (!anthropic) {
      return NextResponse.json(fallback);
    }

    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Return 4 nearby options, 2 micro-interventions, meal timing, and a proactive alert for location (${lat}, ${lon}) and time ${currentTime || new Date().toISOString()}.`,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    let parsed: SuggestResponse;
    try {
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      return NextResponse.json(fallback);
    }

    if (!Array.isArray(parsed.nearbyOptions) || parsed.nearbyOptions.length === 0) {
      return NextResponse.json(fallback);
    }

    if (parsed.nearbyOptions.length > 4) {
      parsed.nearbyOptions = parsed.nearbyOptions.slice(0, 4);
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error('Suggest API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      ...buildFallbackSuggestions(1200, 70, 'maintain weight'),
      warning: message,
    });
  }
}
