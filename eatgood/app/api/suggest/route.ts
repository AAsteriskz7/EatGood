import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { latitude, longitude, userProfile, schedule, currentTime } = body;

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

    const systemPrompt = `You are AnchorFuel, a proactive AI health coach for traveling professionals (journalists, correspondents, field crews). You act BEFORE the user has to ask. Based on their location, schedule, and time of day, you provide:

1. NEARBY FOOD SUGGESTIONS: Based on their approximate location (lat/lng provided), suggest 3-4 realistic food options they might find nearby (common chain restaurants, airport food, hotel options, convenience stores depending on context). For each, recommend a specific menu item that fits their macros.

2. MICRO-INTERVENTIONS: Based on their schedule and fatigue level, suggest 1-2 brief physical or mental wellness actions (5-10 min mobility stretch, breathing exercise, hydration reminder, short walk) that fit into their schedule gaps.

3. MEAL TIMING ADVICE: Based on their remaining caloric budget and upcoming schedule, advise when they should eat next and what type of meal (heavy, light, snack).

User profile:
- Diet: ${dietLabel}
- Goal: ${goalLabel}
- Daily calorie target: ${calorieTarget} kcal
- Remaining today: ${remainingCalories} kcal
- Protein target: ${proteinTarget}g, remaining: ${remainingProtein}g
- Allergies: ${allergies}

Location: Latitude ${latitude}, Longitude ${longitude}
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
- Micro-interventions should be doable in a hotel room, airport gate, or office.
- type for micro-interventions: "movement", "breathing", "hydration", "rest"
- type for nearby food: "good", "okay", "avoid"`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Based on my current location (${latitude}, ${longitude}), schedule, and remaining nutritional budget, what should I eat nearby, and what micro-interventions should I do right now? Current time: ${currentTime || new Date().toISOString()}`,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    let parsed;
    try {
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response', raw: textContent.text }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error('Suggest API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
