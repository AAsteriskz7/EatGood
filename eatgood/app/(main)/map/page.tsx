'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useUserProfile } from '@/context/UserProfileContext';
import type { SavedRestaurant } from '@/context/UserProfileContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin, Loader2, RefreshCw, X, Bookmark, BookmarkCheck,
  Check, Minus, AlertTriangle, UtensilsCrossed,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Styles ───────────────────────────────────────────────────────────────────

const RECO_STYLE: Record<string, { bg: string; text: string; border: string; icon: React.ElementType; mapColor: string }> = {
  good:  { bg: 'bg-primary/10',           text: 'text-primary',          border: 'border-primary/20',          icon: Check,         mapColor: '#e8893b' },
  okay:  { bg: 'bg-feedback-warning/10',  text: 'text-feedback-warning', border: 'border-feedback-warning/20', icon: Minus,         mapColor: '#c49a44' },
  avoid: { bg: 'bg-destructive/10',       text: 'text-destructive',      border: 'border-destructive/20',      icon: AlertTriangle, mapColor: '#d94f4f' },
};

const FILTERS = [
  { id: 'all',           label: 'All' },
  { id: 'good',          label: 'Best for me' },
  { id: 'vegan-friendly',label: 'Vegan' },
  { id: 'vegetarian',    label: 'Vegetarian' },
  { id: 'high-protein',  label: 'High protein' },
  { id: 'low-calorie',   label: 'Low calorie' },
  { id: 'gluten-free',   label: 'Gluten-free' },
  { id: 'halal',         label: 'Halal' },
];

// ─── Lazy-loaded Leaflet Map ──────────────────────────────────────────────────

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false, loading: () => (
  <div className="w-full h-full bg-muted flex items-center justify-center">
    <Loader2 size={24} className="animate-spin text-primary" />
  </div>
)});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MapPage() {
  const {
    profile, location, locationError, requestLocation,
    remainingCalories, remainingProtein,
    savedRestaurants, saveRestaurant, unsaveRestaurant,
  } = useUserProfile();

  const [places, setPlaces] = useState<RatedPlace[]>([]);
  // Start loading=true so the map never flashes "0 restaurants" before the first fetch
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selected, setSelected] = useState<RatedPlace | null>(null);
  const hasFetched = useRef(false);

  const fetchPlaces = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    setError(null);
    setPlaces([]);
    try {
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          userProfile: {
            dietPreference: profile.dietPreference,
            fitnessGoal: profile.fitnessGoal,
            allergies: profile.allergies,
            remainingCalories,
            remainingProtein,
          },
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(errBody.error || 'Failed to load places');
      }
      const data = await res.json() as { places?: RatedPlace[] };
      setPlaces(data.places ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load nearby restaurants');
    } finally {
      setLoading(false);
    }
  }, [location, profile, remainingCalories, remainingProtein]);

  useEffect(() => {
    // Only auto-fetch once per mount; refresh button resets hasFetched
    if (location && !hasFetched.current) {
      hasFetched.current = true;
      fetchPlaces();
    } else if (!location) {
      // If location hasn't resolved yet, don't keep spinner on forever
      setLoading(false);
    }
  }, [location, fetchPlaces]);

  const filtered = places.filter((p) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'good') return p.recommendation === 'good';
    return p.tags?.includes(activeFilter);
  });

  const isSaved = (name: string) => savedRestaurants.some((r) => r.name === name);

  const toggleSave = (p: RatedPlace) => {
    if (isSaved(p.name)) {
      const existing = savedRestaurants.find((r) => r.name === p.name);
      if (existing) unsaveRestaurant(existing.id);
    } else {
      saveRestaurant({ name: p.name, lat: p.lat, lon: p.lon, recommendation: p.recommendation, reason: p.reason });
    }
  };

  return (
    <div className="flex flex-col min-h-0 h-[100dvh] bg-app">
      {/* ── Header ── */}
      <header className="bg-card border-b border-border px-screen pt-14 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="type-heading text-foreground">Nearby Food</h1>
            <p className="type-caption text-muted-foreground mt-0.5">
              {!location
                ? 'Enable location to find nearby options'
                : loading
                  ? 'Searching for restaurants near you…'
                  : `${places.length} restaurant${places.length === 1 ? '' : 's'} rated for your goals`}
            </p>
          </div>
          <button
            onClick={() => { hasFetched.current = false; fetchPlaces(); }}
            disabled={loading || !location}
            aria-label="Refresh restaurant results"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-muted text-primary active:opacity-70 transition-opacity disabled:opacity-40"
          >
            <RefreshCw size={16} strokeWidth={2} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-none pb-1 -mx-screen px-screen">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={[
                'flex-shrink-0 px-3 py-1.5 rounded-full type-micro border transition-colors',
                activeFilter === f.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted text-muted-foreground border-transparent hover:border-border',
              ].join(' ')}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── No location ── */}
      {!location && (
        <div className="flex-1 flex flex-col items-center justify-center px-screen gap-4 text-center pb-nav">
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
            <MapPin size={28} strokeWidth={1.75} className="text-primary" />
          </div>
          <div>
            <p className="type-subheading text-foreground">Location required</p>
            <p className="type-body text-muted-foreground mt-1 max-w-[260px]">
              Allow location access to see real restaurants near you, rated for your health goals.
            </p>
          </div>
          {locationError && <p className="type-caption text-destructive">{locationError}</p>}
          <Button onClick={requestLocation} variant="default">Allow Location</Button>
        </div>
      )}

      {/* ── Map + list ── */}
      {location && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden pb-nav">
          {/* Map — flex-[4] vs flex-1 list (~80% of area below header) */}
          <div className="flex-[4] min-h-0 relative px-screen pt-3">
            <div className="relative w-full h-full rounded-[var(--radius-card)] overflow-hidden border border-border bg-card shadow-card">
            <MapView
              center={[location.latitude, location.longitude]}
              places={filtered}
              selected={selected}
              onSelect={(p) => setSelected(p)}
            />
            {/* Subtle overlay while places are loading so pins don't pop in unexpectedly */}
            {loading && (
              <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-10">
                <div className="bg-card/90 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-sm">
                  <Loader2 size={14} className="animate-spin text-primary" />
                  <span className="type-micro text-muted-foreground">Loading map data…</span>
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="px-screen pt-3">
              <Card className="border-destructive/20">
                <CardContent className="pt-3 pb-3">
                  <p className="type-caption text-destructive">{error}</p>
                  <Button onClick={fetchPlaces} variant="default" size="sm" className="mt-2 w-full">Retry</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Loading state — shown while the API call is in flight */}
          {loading && (
            <div className="flex-1 min-h-0 flex items-center justify-center gap-3">
              <Loader2 size={20} className="animate-spin text-primary" />
              <span className="type-body text-muted-foreground">Finding restaurants near you…</span>
            </div>
          )}

          {/* Empty filter match */}
          {!loading && !error && filtered.length === 0 && places.length > 0 && (
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-2 px-screen">
              <UtensilsCrossed size={24} strokeWidth={1.75} className="text-muted-foreground" />
              <p className="type-caption text-muted-foreground text-center">No restaurants match this filter.</p>
            </div>
          )}

          {/* No results at all after a successful load */}
          {!loading && !error && places.length === 0 && (
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-2 px-screen text-center">
              <UtensilsCrossed size={28} strokeWidth={1.5} className="text-muted-foreground" />
              <p className="type-subheading text-foreground">No restaurants found</p>
              <p className="type-caption text-muted-foreground max-w-[240px]">
                Try refreshing or expanding the search radius.
              </p>
              <button
                onClick={() => { hasFetched.current = false; fetchPlaces(); }}
                className="mt-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground type-label"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="flex-1 min-h-0 overflow-y-auto px-screen py-3 flex flex-col gap-list">
              {filtered.map((place, i) => {
                const style = RECO_STYLE[place.recommendation] ?? RECO_STYLE.good;
                const Icon = style.icon;
                const saved = isSaved(place.name);
                const isSelected = selected?.name === place.name;

                return (
                  <Card
                    key={place.id || i}
                    className={['animate-fade-up border cursor-pointer transition-shadow', style.border, isSelected ? 'ring-2 ring-primary' : ''].join(' ')}
                    style={{ animationDelay: `${i * 40}ms` }}
                    onClick={() => setSelected(isSelected ? null : place)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className={['w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', style.bg].join(' ')}>
                          <Icon size={16} strokeWidth={2} className={style.text} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="type-label text-foreground font-semibold leading-tight">{place.name}</p>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleSave(place); }}
                              aria-label={saved ? `Remove ${place.name} from saved` : `Save ${place.name}`}
                              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted active:opacity-70 transition-colors"
                            >
                              {saved
                                ? <BookmarkCheck size={16} strokeWidth={2} className="text-primary" />
                                : <Bookmark size={16} strokeWidth={1.75} className="text-muted-foreground" />
                              }
                            </button>
                          </div>
                          <Badge variant="secondary" className={['type-micro mt-1', style.text].join(' ')}>
                            {place.recommendation}
                          </Badge>
                          <p className="type-caption text-muted-foreground mt-1.5 leading-snug">{place.reason}</p>
                          {place.suggestedItem && (
                            <p className="type-micro text-primary mt-1.5 font-medium">
                              Order: {place.suggestedItem}
                            </p>
                          )}
                          {place.tags && place.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {place.tags.map((tag) => (
                                <span key={tag} className="type-micro text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Selected place bottom sheet ── */}
      {selected && (
        <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-2xl border-t border-border bg-card/90 pb-nav pt-4 pb-6 px-screen shadow-card ring-1 ring-foreground/10 backdrop-blur-md supports-backdrop-filter:bg-card/82 animate-fade-up">
          <div className="flex items-start justify-between mb-2">
            <p className="type-subheading text-foreground">{selected.name}</p>
            <button
              onClick={() => setSelected(null)}
              aria-label="Close restaurant detail"
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            >
              <X size={16} strokeWidth={2} className="text-muted-foreground" />
            </button>
          </div>
          {selected.suggestedItem && (
            <p className="type-label text-primary mb-1">Best order: {selected.suggestedItem}</p>
          )}
          <p className="type-body text-muted-foreground">{selected.reason}</p>
          <Button
            onClick={() => toggleSave(selected)}
            variant={isSaved(selected.name) ? 'secondary' : 'default'}
            className="w-full mt-4 h-12"
          >
            {isSaved(selected.name)
              ? <><BookmarkCheck size={16} strokeWidth={2} className="mr-2" /> Saved</>
              : <><Bookmark size={16} strokeWidth={1.75} className="mr-2" /> Save restaurant</>
            }
          </Button>
        </div>
      )}
    </div>
  );
}
