'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useUserProfile } from '@/context/UserProfileContext';
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

const RECO_STYLE: Record<
  string,
  { bg: string; text: string; border: string; icon: React.ElementType; label: string }
> = {
  good:  { bg: 'bg-primary/10',          text: 'text-primary',          border: 'border-primary/30',          icon: Check,         label: 'Great choice' },
  okay:  { bg: 'bg-feedback-warning/10', text: 'text-feedback-warning', border: 'border-feedback-warning/30', icon: Minus,         label: 'OK option' },
  avoid: { bg: 'bg-destructive/10',      text: 'text-destructive',      border: 'border-destructive/30',      icon: AlertTriangle, label: 'Avoid' },
};

const FILTERS = [
  { id: 'all',            label: 'All' },
  { id: 'good',           label: 'Best for me' },
  { id: 'vegan-friendly', label: 'Vegan' },
  { id: 'vegetarian',     label: 'Vegetarian' },
  { id: 'high-protein',   label: 'High protein' },
  { id: 'low-calorie',    label: 'Low calorie' },
  { id: 'gluten-free',    label: 'Gluten-free' },
  { id: 'halal',          label: 'Halal' },
];

// ─── Lazy-loaded Leaflet Map ──────────────────────────────────────────────────

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-primary" />
    </div>
  ),
});

// ─── Place card (overlaid on map) ─────────────────────────────────────────────

function PlaceCard({
  place,
  saved,
  onClose,
  onToggleSave,
}: {
  place: RatedPlace;
  saved: boolean;
  onClose: () => void;
  onToggleSave: () => void;
}) {
  const style = RECO_STYLE[place.recommendation] ?? RECO_STYLE.good;
  const Icon = style.icon;

  return (
    <div
      className="animate-fade-up"
      // Dismiss on backdrop tap
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={[
          'rounded-2xl border bg-card/92 backdrop-blur-xl shadow-card',
          style.border,
        ].join(' ')}
      >
        {/* Header row */}
        <div className="flex items-start gap-3 p-4 pb-3">
          <div className={['w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', style.bg].join(' ')}>
            <Icon size={16} strokeWidth={2} className={style.text} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="type-label text-foreground font-semibold leading-snug">{place.name}</p>
            <Badge variant="secondary" className={['type-micro mt-0.5', style.text].join(' ')}>
              {style.label}
            </Badge>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors flex-shrink-0"
          >
            <X size={15} strokeWidth={2} className="text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 pb-4 space-y-2">
          {place.suggestedItem && (
            <p className="type-label text-primary font-medium">
              Order: {place.suggestedItem}
            </p>
          )}
          <p className="type-body text-muted-foreground leading-snug">{place.reason}</p>
          {place.tags && place.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {place.tags.map((tag) => (
                <span key={tag} className="type-micro text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Save button */}
          <Button
            onClick={onToggleSave}
            variant={saved ? 'secondary' : 'default'}
            className="w-full mt-1 h-11"
          >
            {saved
              ? <><BookmarkCheck size={15} strokeWidth={2} className="mr-2" /> Saved</>
              : <><Bookmark size={15} strokeWidth={1.75} className="mr-2" /> Save restaurant</>
            }
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MapPage() {
  const {
    profile, location, locationError, requestLocation,
    remainingCalories, remainingProtein,
    savedRestaurants, saveRestaurant, unsaveRestaurant,
  } = useUserProfile();

  const [places, setPlaces] = useState<RatedPlace[]>([]);
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
    setSelected(null);
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
    if (location && !hasFetched.current) {
      hasFetched.current = true;
      fetchPlaces();
    } else if (!location) {
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
    <div className="flex flex-col h-[100dvh]">
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
              onClick={() => { setActiveFilter(f.id); setSelected(null); }}
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

      {/* ── Full-screen map ── */}
      {location && (
        // Dismiss card when tapping the map background
        <div
          className="flex-1 relative"
          onClick={() => setSelected(null)}
        >
          {/* Map fills the area up to the bottom nav */}
          <div className="absolute inset-x-0 top-0" style={{ bottom: 'calc(var(--spacing-nav-clear, 6.5rem) + env(safe-area-inset-bottom, 0px))' }}>
            <MapView
              center={[location.latitude, location.longitude]}
              places={filtered}
              selected={selected}
              onSelect={setSelected}
            />
          </div>

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-[801]">
              <div className="bg-card/90 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm">
                <Loader2 size={14} className="animate-spin text-primary" />
                <span className="type-micro text-muted-foreground">Loading restaurants…</span>
              </div>
            </div>
          )}

          {/* Error toast */}
          {error && !loading && (
            <div className="absolute top-3 inset-x-3 z-[801] bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 flex items-center gap-3">
              <AlertTriangle size={16} strokeWidth={2} className="text-destructive flex-shrink-0" />
              <p className="type-caption text-destructive flex-1">{error}</p>
              <button
                onClick={(e) => { e.stopPropagation(); fetchPlaces(); }}
                className="type-micro text-primary font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty state toast */}
          {!loading && !error && places.length === 0 && (
            <div className="absolute top-3 inset-x-3 z-[801] bg-card/90 backdrop-blur-sm border border-border rounded-xl px-4 py-3 flex items-center gap-3">
              <UtensilsCrossed size={16} strokeWidth={1.75} className="text-muted-foreground flex-shrink-0" />
              <p className="type-caption text-muted-foreground flex-1">No restaurants found nearby.</p>
              <button
                onClick={(e) => { e.stopPropagation(); hasFetched.current = false; fetchPlaces(); }}
                className="type-micro text-primary font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {/* Filter-no-match toast */}
          {!loading && !error && filtered.length === 0 && places.length > 0 && (
            <div className="absolute top-3 inset-x-3 z-[801] bg-card/90 backdrop-blur-sm border border-border rounded-xl px-4 py-3 flex items-center gap-3">
              <UtensilsCrossed size={16} strokeWidth={1.75} className="text-muted-foreground flex-shrink-0" />
              <p className="type-caption text-muted-foreground">No restaurants match this filter.</p>
            </div>
          )}

          {/* Pin count badge (top-right) */}
          {!loading && filtered.length > 0 && (
            <div className="absolute top-3 right-3 z-[801] bg-card/90 backdrop-blur-sm border border-border rounded-full px-3 py-1 pointer-events-none">
              <span className="type-micro text-muted-foreground">{filtered.length} pin{filtered.length !== 1 ? 's' : ''}</span>
            </div>
          )}

          {/* ── Place detail card — sits above the bottom of the map area ── */}
          {selected && (
            <div className="absolute inset-x-3 bottom-3 z-[800]">
              <PlaceCard
                place={selected}
                saved={isSaved(selected.name)}
                onClose={() => setSelected(null)}
                onToggleSave={() => toggleSave(selected)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
