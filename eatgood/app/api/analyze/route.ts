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
    const allergies = userProfile?.allergies?.length ? userProfile.allergies.join(', ') : 'none';

    let systemPrompt = '';
    let userPrompt = '';

    if (mode === 'fridge') {
      systemPrompt = `You are AnchorFuel, an AI nutritionist for busy traveling professionals. The user just opened their fridge and took a photo. You must identify what ingredients are visible and generate a quick, healthy recipe using ONLY those ingredients.

User profile:
- Diet: ${dietLabel}
- Goal: ${goalLabel}  
- Daily calorie target: ${calorieTarget} kcal
- Remaining today: ${remainingCalories} kcal
- Protein target: ${proteinTarget}g, remaining: ${remainingProtein}g
- Allergies: ${allergies}

Respond in STRICT JSON format (no markdown, no code fences):
{
  "ingredients_found": ["item1", "item2"],
  "recipe": {
    "name": "Recipe Name",
    "cookTime": "5 min",
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
      "reason": "reason why",
      "estimatedCalories": 100,
      "estimatedProtein": 10,
      "estimatedCarbs": 15,
      "estimatedFat": 3
    }
  ]
}`;
      userPrompt = 'Analyze this fridge photo. Identify ingredients and create a quick healthy recipe using only what you see. Ensure the recipe fits my remaining calorie and macro budget for today.';
    } else {
      // Menu / general food analysis mode
      systemPrompt = `You are AnchorFuel, an AI nutritionist for busy traveling professionals. The user pointed their camera at a food environment (restaurant menu, buffet, food options, or a single meal). Analyze EVERY food item you can identify and categorize each as "good", "okay", or "avoid" based on their health profile.

User profile:
- Diet: ${dietLabel}
- Goal: ${goalLabel}
- Daily calorie target: ${calorieTarget} kcal
- Remaining today: ${remainingCalories} kcal
- Protein target: ${proteinTarget}g, remaining: ${remainingProtein}g
- Allergies: ${allergies}

Respond in STRICT JSON format (no markdown, no code fences):
{
  "items": [
    {
      "name": "Food Item Name",
      "recommendation": "good",
      "reason": "One-sentence contextual reason tied to their goals",
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
- Be specific and contextual in reasons (reference their remaining calories, their goal, time of day)
- Estimate macros as accurately as possible`;
      userPrompt = 'Analyze this image. Identify all food items or menu items and rate each one for me based on my health goals. Be specific about why each is good, okay, or should be avoided given my remaining calorie and macro budget today.';
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
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
      // Try to extract JSON from the response (in case Claude wraps it)
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
