import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = anthropicApiKey ? new Anthropic({ apiKey: anthropicApiKey }) : null;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

interface OverpassElement {
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

interface RatedPlace {
  id: number;
  name: string;
  lat: number;
  lon: number;
  amenity: string;
  recommendation: 'good' | 'okay' | 'avoid';
  reason: string;
  suggestedItem?: string;
  tags: string[];
}

interface NearbyPlace {
  id: number;
  name: string;
  lat: number;
  lon: number;
  amenity: string;
  cuisine?: string;
}

interface UserProfileInput {
  dietPreference?: string;
  fitnessGoal?: string;
  allergies?: string[];
  remainingCalories?: number;
  remainingProtein?: number;
  calorieTarget?: number;
}

function buildFallbackRatings(
  places: NearbyPlace[],
  latitude: number,
  longitude: number,
  userProfile?: UserProfileInput
): RatedPlace[] {
  const remainingCalories = userProfile?.remainingCalories ?? userProfile?.calorieTarget ?? 2000;
  const diet = (userProfile?.dietPreference || 'any').toLowerCase();
  const goal = (userProfile?.fitnessGoal || '').toLowerCase();

  const sourcePlaces = places.length
    ? places
    : Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * 2 * Math.PI;
        const offset = 0.0025;
        return {
          id: Date.now() + i,
          name: `Nearby Food Spot ${i + 1}`,
          lat: latitude + offset * Math.cos(angle),
          lon: longitude + offset * Math.sin(angle),
          amenity: i % 2 === 0 ? 'restaurant' : 'cafe',
        } as NearbyPlace;
      });

  return sourcePlaces.slice(0, 25).map((place, i) => {
    const cuisine = (place.cuisine || '').toLowerCase();
    const tags = new Set<string>();
    if (diet.includes('vegan')) tags.add('vegan-friendly');
    if (diet.includes('vegetarian')) tags.add('vegetarian');
    if (diet.includes('halal')) tags.add('halal');
    if (diet.includes('kosher')) tags.add('kosher');
    if (goal.includes('muscle') || goal.includes('protein')) tags.add('high-protein');
    if (goal.includes('weight') || goal.includes('lose')) tags.add('low-calorie');
    if (cuisine.includes('salad') || cuisine.includes('grill') || cuisine.includes('mediterranean')) {
      tags.add('high-protein');
      tags.add('low-calorie');
    }
    if (cuisine.includes('vegan')) tags.add('vegan-friendly');

    const recommendation: RatedPlace['recommendation'] =
      tags.has('high-protein') || tags.has('low-calorie')
        ? 'good'
        : remainingCalories < 500
          ? 'avoid'
          : 'okay';

    const reason =
      recommendation === 'good'
        ? `Likely a better fit for your remaining ${remainingCalories} kcal and current goal.`
        : recommendation === 'avoid'
          ? `May be harder to fit within your remaining ${remainingCalories} kcal budget today.`
          : `Could work in moderation with your remaining ${remainingCalories} kcal budget.`;

    return {
      id: place.id || i + 1,
      name: place.name,
      lat: place.lat,
      lon: place.lon,
      amenity: place.amenity || 'restaurant',
      recommendation,
      reason,
      suggestedItem: recommendation === 'good' ? 'Grilled protein bowl with vegetables' : 'Portion-controlled combo',
      tags: Array.from(tags),
    };
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { latitude, longitude, radius = 1000, userProfile } = body;

    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'Location required' }, { status: 400 });
    }

    // ── Overpass query with manual AbortController timeout ──────────────────
    const query = `[out:json][timeout:20];node["amenity"~"restaurant|cafe|fast_food|food_court"](around:${radius},${latitude},${longitude});out body;`;
    let overpassPlaces: NearbyPlace[] = [];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 14000);

    try {
      const overpassRes = await fetch(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (overpassRes.ok) {
        const overpassData = await overpassRes.json();
        overpassPlaces = (overpassData.elements as OverpassElement[])
          .filter((el) => el.tags?.name)
          .map((el) => ({
            id: el.id,
            name: el.tags!.name!,
            lat: el.lat,
            lon: el.lon,
            amenity: el.tags!.amenity || 'restaurant',
            cuisine: el.tags!.cuisine,
          }))
          .slice(0, 25);
      }
    } catch {
      clearTimeout(timeoutId);
      // Overpass timed out or unavailable — fall through to AI-only mode
    }

    const dietLabel = userProfile?.dietPreference === 'any' ? 'no dietary restrictions' : userProfile?.dietPreference;
    const goalLabel = (userProfile?.fitnessGoal as string | undefined)?.replace('_', ' ') || 'maintain weight';
    const remainingCalories = userProfile?.remainingCalories ?? userProfile?.calorieTarget ?? 2000;
    const remainingProtein = userProfile?.remainingProtein ?? 0;
    const allergies = (userProfile?.allergies as string[] | undefined)?.length
      ? (userProfile.allergies as string[]).join(', ')
      : 'none';

    const hasRealPlaces = overpassPlaces.length > 0;

    let placesContext: string;
    if (hasRealPlaces) {
      placesContext =
        `Real nearby restaurants from OpenStreetMap (use ONLY these names — do not rename them):\n` +
        overpassPlaces
          .map((p, i) => `${i + 1}. "${p.name}" (${p.amenity}${p.cuisine ? `, cuisine: ${p.cuisine}` : ''})`)
          .join('\n');
    } else {
      // AI fallback: provide explicit coordinates so Claude can generate realistic offsets
      placesContext =
        `No real restaurant data is available. Generate 5 plausible food options a person ` +
        `at latitude ${latitude}, longitude ${longitude} could realistically visit. ` +
        `For each place, set lat/lon to a realistic location NEAR ${latitude}, ${longitude} ` +
        `(within 0.005 degrees). Use unique, realistic restaurant names for this area.`;
    }

    const systemPrompt = `You are AnchorFuel, a precision AI nutritionist rating nearby food options for a traveling professional.

User profile:
- Diet: ${dietLabel}
- Goal: ${goalLabel}
- Remaining budget today: ${remainingCalories} kcal, ${remainingProtein}g protein remaining
- Allergies: ${allergies}

${placesContext}

For each place return:
- name: exact name as provided (do not modify)${hasRealPlaces ? '' : ', or the generated name'}
- lat / lon: ${hasRealPlaces ? 'use 0.0 — the server will fill in real coordinates' : 'a realistic coordinate near the user (within 0.005° of the given lat/lon)'}
- amenity: "restaurant", "cafe", or "fast_food"
- recommendation: "good" | "okay" | "avoid" based on whether it fits the user's macros and diet
- reason: one specific sentence referencing their remaining ${remainingCalories} kcal and goal
- suggestedItem: the single best menu item to order given their goal
- tags: relevant tags from ["vegan-friendly","vegetarian","high-protein","low-calorie","gluten-free","keto-friendly","halal","kosher"]

Respond in STRICT JSON only (no markdown, no code fences):
{"places":[{"id":1,"name":"Name","lat":${hasRealPlaces ? '0.0' : latitude},"lon":${hasRealPlaces ? '0.0' : longitude},"amenity":"restaurant","recommendation":"good","reason":"…","suggestedItem":"…","tags":[]}]}`;

    const userMsg = hasRealPlaces
      ? `Rate these ${overpassPlaces.length} restaurants for my health goals. Keep their names exactly as given.`
      : `Suggest 5 food options near latitude ${latitude}, longitude ${longitude} and rate them for my health goals.`;

    const fallbackPlaces = buildFallbackRatings(overpassPlaces, latitude, longitude, userProfile);

    if (!anthropic) {
      return NextResponse.json({
        places: fallbackPlaces,
        degraded: true,
        source: hasRealPlaces ? 'overpass-fallback' : 'synthetic-fallback',
      });
    }

    try {
      const response = await anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMsg }],
      });

      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        return NextResponse.json({
          places: fallbackPlaces,
          degraded: true,
          source: hasRealPlaces ? 'overpass-fallback' : 'synthetic-fallback',
          warning: 'No AI response',
        });
      }

      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({
          places: fallbackPlaces,
          degraded: true,
          source: hasRealPlaces ? 'overpass-fallback' : 'synthetic-fallback',
          warning: 'Could not parse AI response',
        });
      }

      const rated = JSON.parse(jsonMatch[0]) as { places: RatedPlace[] };
      if (!Array.isArray(rated.places) || rated.places.length === 0) {
        return NextResponse.json({
          places: fallbackPlaces,
          degraded: true,
          source: hasRealPlaces ? 'overpass-fallback' : 'synthetic-fallback',
          warning: 'AI returned no places',
        });
      }

      // ── Merge real coordinates from Overpass ────────────────────────────────
      // Claude always outputs lat=0.0 for real places; we replace with Overpass truth.
      // For AI-fallback places, Claude provides estimated coords — keep them.
      const merged: RatedPlace[] = rated.places.map((rp, i) => {
        if (!hasRealPlaces) {
          // AI-generated: if Claude still output 0.0 coords, spread around user location
          const lat = rp.lat && Math.abs(rp.lat) > 0.0001 ? rp.lat : latitude + (Math.random() - 0.5) * 0.006;
          const lon = rp.lon && Math.abs(rp.lon) > 0.0001 ? rp.lon : longitude + (Math.random() - 0.5) * 0.006;
          return { ...rp, lat, lon, id: i + 1 };
        }

        // Real-place mode: match by name (case-insensitive, trimmed)
        const nameLower = rp.name?.toLowerCase().trim();
        const original = overpassPlaces.find(
          (p) =>
            p.name.toLowerCase().trim() === nameLower ||
            p.name.toLowerCase().trim().includes(nameLower) ||
            nameLower?.includes(p.name.toLowerCase().trim())
        );

        if (original) {
          return { ...rp, lat: original.lat, lon: original.lon, id: original.id };
        }

        // No coordinate match — spread around user location so it still shows on map
        const angle = (i / rated.places.length) * 2 * Math.PI;
        const offset = 0.002;
        return {
          ...rp,
          lat: latitude + offset * Math.cos(angle),
          lon: longitude + offset * Math.sin(angle),
          id: Date.now() + i,
        };
      });

      return NextResponse.json({ places: merged });
    } catch (aiError) {
      console.error('Places AI fallback triggered:', aiError);
      return NextResponse.json({
        places: fallbackPlaces,
        degraded: true,
        source: hasRealPlaces ? 'overpass-fallback' : 'synthetic-fallback',
        warning: 'AI request failed',
      });
    }
  } catch (error: unknown) {
    console.error('Places API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
