import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { foodName, userProfile } = body;

    if (!foodName?.trim()) {
      return NextResponse.json({ error: 'Food name required' }, { status: 400 });
    }

    const goalLabel = userProfile?.fitnessGoal?.replace('_', ' ') || 'maintain weight';
    const dietLabel = userProfile?.dietPreference === 'any' ? 'no dietary restrictions' : userProfile?.dietPreference;
    const remainingCalories = userProfile?.remainingCalories ?? 'unknown';
    const allergies = userProfile?.allergies?.length ? userProfile.allergies.join(', ') : 'none';

    const prompt = `You are AnchorFuel, a nutrition coach. The user is about to eat "${foodName}" which was flagged as something to avoid for their goals.

User goals: ${goalLabel}. Diet: ${dietLabel}. Remaining budget: ${remainingCalories} kcal. Allergies: ${allergies}.

Suggest exactly 3 healthier alternatives that are:
- Realistic and widely available (grocery store, convenience store, or common restaurant item)
- Better for their specific goal
- Non-judgmental in tone
- Roughly satisfying the same craving/need

Respond in STRICT JSON (no markdown, no code fences):
{
  "swaps": [
    {
      "name": "Specific food name",
      "reason": "One sentence: why this is better for their goal",
      "estimatedCalories": 0,
      "estimatedProtein": 0
    }
  ]
}`;

    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'No AI response' }, { status: 500 });
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 });
    }

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (error: unknown) {
    console.error('Snack swap API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
