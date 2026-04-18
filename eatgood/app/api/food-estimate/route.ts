import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

const PORTION_ANCHORS = `
VISUAL PORTION ESTIMATION ANCHORS:
- Palm (85–115g) of cooked meat/fish ≈ 150–200 kcal, 25–30g protein
- Fist (1 cup / 240ml) of cooked grains/pasta ≈ 200–240 kcal, 42–48g carbs
- Cupped hand (~120ml) of legumes ≈ 110–130 kcal, 7–8g protein, 20g carbs
- Thumb (15ml) of oil/butter ≈ 100–120 kcal, 12–14g fat
- Large egg ≈ 70–80 kcal, 6g protein, 5g fat
- Slice of bread ≈ 70–100 kcal, 2–4g protein, 13–18g carbs
- Medium banana ≈ 90–105 kcal, 23–27g carbs
- Restaurant mains are typically 1.5–2× home portions`.trim();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { foodDescription, servingSize, userProfile } = body;

    if (!foodDescription?.trim()) {
      return NextResponse.json({ error: 'No food description provided' }, { status: 400 });
    }

    const goalLabel = userProfile?.fitnessGoal?.replace('_', ' ') || 'maintain weight';
    const remainingCalories = userProfile?.remainingCalories ?? 'unknown';
    const allergies = userProfile?.allergies?.length ? userProfile.allergies.join(', ') : 'none';

    const prompt = `You are a precision nutrition estimator. A user typed: "${foodDescription}"${servingSize ? ` (serving size: ${servingSize})` : ''}.

Their goal: ${goalLabel}. Remaining budget today: ${remainingCalories} kcal. Allergies: ${allergies}.

${PORTION_ANCHORS}

RULES:
1. Use USDA reference values as your baseline.
2. If a serving size was specified, use it exactly. Otherwise assume one standard serving.
3. Do NOT round to suspiciously even numbers — real foods have irregular values.
4. Account for cooking method if mentioned (fried, grilled, raw, etc.).
5. If the food contains an allergen, set recommendation to "avoid".
6. Confidence: "high" if it's a well-known standard food, "medium" if serving size is ambiguous, "low" if it's a complex dish.

Respond in STRICT JSON (no markdown, no code fences):
{
  "name": "Clean food name",
  "servingSize": "Standardized serving description e.g. '1 cup (240ml)' or '1 medium (118g)'",
  "estimatedCalories": 0,
  "estimatedProtein": 0,
  "estimatedCarbs": 0,
  "estimatedFat": 0,
  "recommendation": "good | okay | avoid",
  "reason": "One sentence: why this fits or doesn't fit their goal and remaining budget",
  "confidence": "high | medium | low"
}`;

    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse AI response', raw: textContent.text }, { status: 500 });
    }

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (error: unknown) {
    console.error('Food estimate API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
