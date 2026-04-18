import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mode, userProfile } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Strip data URL prefix if present
    const base64Data = imageBase64.includes(',')
      ? imageBase64.split(',')[1]
      : imageBase64;

    // Determine media type
    let mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg';
    if (imageBase64.includes('data:image/png')) mediaType = 'image/png';
    else if (imageBase64.includes('data:image/webp')) mediaType = 'image/webp';

    const dietLabel = userProfile?.dietPreference === 'any' ? 'no dietary restrictions' : userProfile?.dietPreference;
    const goalLabel = userProfile?.fitnessGoal?.replace('_', ' ') || 'maintain weight';
    const calorieTarget = userProfile?.calorieTarget ?? 2000;
    const remainingCalories = userProfile?.remainingCalories ?? calorieTarget;
    const proteinTarget = userProfile?.proteinTarget ?? 150;
    const remainingProtein = userProfile?.remainingProtein ?? proteinTarget;
    const remainingCarbs = userProfile?.remainingCarbs ?? 200;
    const remainingFat = userProfile?.remainingFat ?? 65;
    const allergies = userProfile?.allergies?.length ? userProfile.allergies.join(', ') : 'none';

    // ── Agentic Routing: Triage Agent vs Culinary Agent ──
    const now = new Date();
    const scheduleItems: string[] = userProfile?.schedule || [];
    let isTriageMode = false;
    let triageReason = '';

    for (const evtStr of scheduleItems) {
      const atMatch = evtStr.match(/at\s+(\d{1,2}):(\d{2})/);
      if (atMatch) {
        const hours = parseInt(atMatch[1], 10);
        const minutes = parseInt(atMatch[2], 10);
        const evtTime = new Date();
        evtTime.setHours(hours, minutes, 0, 0);
        const diffMin = (evtTime.getTime() - now.getTime()) / 60000;
        if (diffMin > 0 && diffMin < 75) {
          isTriageMode = true;
          triageReason = evtStr;
          break;
        }
      }
    }

    const agentMode = isTriageMode ? 'TRIAGE AGENT' : 'CULINARY AGENT';

    let systemPrompt = '';
    let userPrompt = '';

    const PORTION_ANCHORS = `
VISUAL PORTION ESTIMATION ANCHORS (use these to ground every estimate):
- Palm (3–4 oz / 85–115g) of cooked meat/fish ≈ 150–200 kcal, 25–30g protein
- Fist (1 cup / ~240ml) of cooked grains/pasta ≈ 200–240 kcal, 4–6g protein, 42–48g carbs
- Cupped hand (~1/2 cup) of legumes/beans ≈ 110–130 kcal, 7–8g protein, 20g carbs
- Thumb (1 tbsp / 15ml) of oil/butter ≈ 100–120 kcal, 12–14g fat
- Golf ball (2 tbsp) of nut butter ≈ 180–200 kcal, 7g protein, 16g fat
- Deck of cards (3 oz / 85g) of cheese ≈ 300–340 kcal, 21g protein, 24g fat
- Large egg ≈ 70–80 kcal, 6g protein, 5g fat, <1g carbs
- Medium banana ≈ 90–105 kcal, 1g protein, 23–27g carbs
- Slice of bread ≈ 70–100 kcal, 2–4g protein, 13–18g carbs
- Restaurant main course portions are typically 1.5–2.5× home portions`.trim();

    const MACRO_RULES = `
MACRO ESTIMATION RULES:
1. Identify the item → estimate visible portion size using the anchors above → look up USDA/standard reference values → scale to portion → output numbers.
2. Never round to suspiciously even numbers (e.g. exactly 400 kcal, exactly 30g protein). Real food has irregular values.
3. For restaurant dishes, assume generous restaurant portioning (1.5–2× home serving).
4. For packaged/branded items you can read on the label, use those values exactly.
5. Sauces, dressings, and oils add significant hidden calories — always include them if visible (e.g. dressing on a salad adds 150–300 kcal).
6. Mixed dishes (stir-fry, curry, sandwich): break into components mentally, estimate each, then sum.
7. Cooking method matters: fried adds ~50–150 kcal per serving vs grilled; creamy sauces add 100–200 kcal.`.trim();

    if (mode === 'fridge') {
      systemPrompt = `You are AnchorFuel operating as ${agentMode} — a precision AI nutritionist for traveling professionals. Your macro estimates must be grounded in real food science, not guesses.

${isTriageMode
  ? `MODE: TRIAGE. The user is in a rush (${triageReason}). Prioritize 3-minute prep, non-bloating ingredients, grab-and-go ideas. Keep reasons punchy and direct.`
  : 'MODE: CULINARY. The user has time. Provide a detailed recipe with cooking guidance, flavor notes, and accurate macro breakdowns.'}

USER PROFILE:
- Diet: ${dietLabel}
- Goal: ${goalLabel}
- Remaining budget today: ${remainingCalories} kcal · ${remainingProtein}g protein · ${remainingCarbs}g carbs · ${remainingFat}g fat
- Allergies: ${allergies}

${PORTION_ANCHORS}

${MACRO_RULES}

TASK: Identify every ingredient visible in the fridge photo. For each ingredient, estimate its available quantity and per-serving macros. Then generate ONE recipe using ONLY those ingredients that best fits the user's remaining macro budget.

For the recipe, calculate macros by summing the contribution of each ingredient at the quantities used — show this in ingredientBreakdown.

Respond in STRICT JSON (no markdown, no code fences):
{
  "ingredients_found": ["item1 (~quantity)", "item2 (~quantity)"],
  "recipe": {
    "name": "Recipe Name",
    "servingSize": "1 serving (~Xg)",
    "cookTime": "${isTriageMode ? '3–5 min' : '15–25 min'}",
    "ingredients": ["Xg / X oz ingredient name"],
    "steps": ["Step 1", "Step 2"],
    "ingredientBreakdown": [
      { "ingredient": "name", "amount": "Xg", "kcal": 0, "protein": 0, "carbs": 0, "fat": 0 }
    ],
    "estimatedCalories": 0,
    "estimatedProtein": 0,
    "estimatedCarbs": 0,
    "estimatedFat": 0,
    "confidence": "high | medium | low"
  },
  "items": [
    {
      "name": "ingredient name",
      "estimatedQuantity": "~X oz / Xg visible",
      "recommendation": "good | okay | avoid",
      "reason": "Specific reason referencing their remaining macros",
      "estimatedCalories": 0,
      "estimatedProtein": 0,
      "estimatedCarbs": 0,
      "estimatedFat": 0,
      "confidence": "high | medium | low"
    }
  ]
}

confidence levels: "high" = packaged label readable or very common food with well-known values; "medium" = portion visible but brand unknown; "low" = partially obscured or ambiguous item.`;

      userPrompt = `Analyze this fridge photo in ${agentMode} mode. Estimate every ingredient's quantity using visual portion anchors, calculate macros accurately, and propose a recipe that fits my remaining budget of ${remainingCalories} kcal, ${remainingProtein}g protein, ${remainingCarbs}g carbs, ${remainingFat}g fat.`;

    } else {
      systemPrompt = `You are AnchorFuel operating as ${agentMode} — a precision AI nutritionist for traveling professionals. Your macro estimates must be grounded in real food science, not guesses.

${isTriageMode
  ? `MODE: TRIAGE. The user is busy (${triageReason}). Recommendations must be rapid, low-bloat, high-energy. Add a "Travel Hack" tip to each reason (e.g. "avoid high-sodium options before a flight to prevent bloating").`
  : 'MODE: CULINARY. The user is settled. Provide detailed nutritional context, cooking method impact, and lifestyle coaching in each reason.'}

USER PROFILE:
- Diet: ${dietLabel}
- Goal: ${goalLabel}
- Remaining budget today: ${remainingCalories} kcal · ${remainingProtein}g protein · ${remainingCarbs}g carbs · ${remainingFat}g fat
- Allergies: ${allergies}

${PORTION_ANCHORS}

${MACRO_RULES}

TASK: Analyze EVERY distinct food item or menu item visible in the image. For each, estimate macros for a standard serving, then rate it as "good", "okay", or "avoid" relative to the user's remaining budget and goals.

Rating definitions:
- "good" = fits remaining macros well and supports their goal
- "okay" = acceptable but will eat significantly into remaining budget or is suboptimal for their goal
- "avoid" = blows the budget, conflicts with their diet, triggers allergies, or actively works against their goal

Respond in STRICT JSON (no markdown, no code fences):
{
  "items": [
    {
      "name": "Food Item Name",
      "servingSize": "standard restaurant portion or ~Xg",
      "recommendation": "good | okay | avoid",
      "reason": "Specific reason referencing their exact remaining kcal/macros and goal. In TRIAGE mode append a Travel Hack.",
      "estimatedCalories": 0,
      "estimatedProtein": 0,
      "estimatedCarbs": 0,
      "estimatedFat": 0,
      "confidence": "high | medium | low"
    }
  ]
}`;

      userPrompt = `Analyze this image in ${agentMode} mode. Use visual portion anchors and USDA reference values to estimate macros for every visible food item. Rate each against my remaining budget: ${remainingCalories} kcal, ${remainingProtein}g protein, ${remainingCarbs}g carbs, ${remainingFat}g fat. Be specific — no round numbers, account for sauces and cooking methods.`;
    }

    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: userPrompt,
            },
          ],
        },
      ],
    });

    // Extract text content
    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    // Parse JSON from response
    let parsed;
    try {
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      return NextResponse.json({
        error: 'Failed to parse AI response',
        raw: textContent.text,
      }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error('Analyze API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
