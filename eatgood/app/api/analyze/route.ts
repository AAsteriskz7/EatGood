import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

    if (mode === 'fridge') {
      systemPrompt = `You are AnchorFuel operating as ${agentMode} — an AI nutritionist for traveling professionals.

${isTriageMode
  ? `MODE: TRIAGE. The user is in a rush (${triageReason}). Focus on speed: 3-minute prep, non-bloating ingredients, grab-and-go ideas. Keep advice punchy.`
  : 'MODE: CULINARY. The user has time and wants depth. Focus on rich nutrition, flavor pairing, and multi-step cooking guidance.'}

User profile:
- Diet: ${dietLabel}
- Goal: ${goalLabel}
- Remaining budget today: ${remainingCalories} kcal · ${remainingProtein}g P · ${remainingCarbs}g C · ${remainingFat}g F
- Allergies: ${allergies}

Identify every ingredient visible in the fridge photo and generate a recipe using ONLY those ingredients.

Respond in STRICT JSON (no markdown, no code fences):
{
  "ingredients_found": ["item1", "item2"],
  "recipe": {
    "name": "Recipe Name",
    "cookTime": "${isTriageMode ? '3-5 min' : '15-25 min'}",
    "ingredients": ["ingredient with amount"],
    "steps": ["step 1", "step 2"],
    "estimatedCalories": 350,
    "estimatedProtein": 25,
    "estimatedCarbs": 30,
    "estimatedFat": 12
  },
  "items": [
    {
      "name": "ingredient name",
      "recommendation": "good",
      "reason": "contextual reason",
      "estimatedCalories": 100,
      "estimatedProtein": 10,
      "estimatedCarbs": 15,
      "estimatedFat": 3
    }
  ]
}`;
      userPrompt = `Analyze this fridge photo in ${agentMode} mode. Create a recipe that fits my remaining macro budget.`;
    } else {
      // Menu / food analysis
      systemPrompt = `You are AnchorFuel operating as ${agentMode} — an AI nutritionist for traveling professionals.

${isTriageMode
  ? `MODE: TRIAGE. The user is busy (${triageReason}). Recommendations MUST be rapid, low-bloat, high-energy. Include "Travel Hacks" in reasons (e.g. "avoid sodium before your flight to prevent bloating"). Keep it punchy.`
  : 'MODE: CULINARY. The user is settled. Provide gourmet-level nutritional breakdowns, lifestyle context, and detailed coaching in each reason.'}

User profile:
- Diet: ${dietLabel}
- Goal: ${goalLabel}
- Remaining budget today: ${remainingCalories} kcal · ${remainingProtein}g P · ${remainingCarbs}g C · ${remainingFat}g F
- Allergies: ${allergies}

Analyze EVERY food item visible and rate each as "good", "okay", or "avoid".

Respond in STRICT JSON (no markdown, no code fences):
{
  "items": [
    {
      "name": "Food Item Name",
      "recommendation": "good",
      "reason": "Contextual reason tied to their goals",
      "estimatedCalories": 450,
      "estimatedProtein": 35,
      "estimatedCarbs": 40,
      "estimatedFat": 15
    }
  ]
}

Rules:
- "good" = fits their macros and diet perfectly right now
- "okay" = acceptable but not optimal
- "avoid" = conflicts with diet, too caloric for remaining budget, or contains allergens
- Reference their EXACT remaining calories and macros in your reasoning
- In TRIAGE mode, add a "Travel Hack" tip to each reason`;
      userPrompt = `Analyze this food environment in ${agentMode} mode. Rate every visible option for my remaining macro budget today.`;
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
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
