'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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

const COLORS: Record<string, { fill: string; ring: string }> = {
  good:  { fill: '#e8893b', ring: '#fff' },
  okay:  { fill: '#c49a44', ring: '#fff' },
  avoid: { fill: '#d94f4f', ring: '#fff' },
};

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

interface MapViewProps {
  center: [number, number];
  places: RatedPlace[];
  selected: RatedPlace | null;
  onSelect: (p: RatedPlace | null) => void;
}

export default function MapView({ center, places, selected, onSelect }: MapViewProps) {
  return (
    <div className="h-full w-full rounded-[var(--radius-card)] overflow-hidden isolate">
      <MapContainer
        center={center}
        zoom={15}
        className="h-full w-full"
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <RecenterMap center={center} />

        {/* User location dot — inner fill + white ring */}
        <CircleMarker
          center={center}
          radius={8}
          pathOptions={{ color: '#fff', fillColor: '#e8893b', fillOpacity: 1, weight: 2.5 }}
        />

        {places.map((place, i) => {
          if (!place.lat || !place.lon) return null;
          const pal = COLORS[place.recommendation] ?? COLORS.good;
          const isSelected = selected?.name === place.name;
          return (
            <CircleMarker
              key={place.id || i}
              center={[place.lat, place.lon]}
              radius={isSelected ? 13 : 9}
              pathOptions={{
                color: isSelected ? pal.fill : 'rgba(0,0,0,0.18)',
                fillColor: pal.fill,
                fillOpacity: isSelected ? 1 : 0.88,
                weight: isSelected ? 3 : 1.5,
              }}
              eventHandlers={{
                click: (e) => {
                  // Stop map click-through so the overlay doesn't immediately dismiss
                  e.originalEvent.stopPropagation();
                  onSelect(isSelected ? null : place);
                },
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
