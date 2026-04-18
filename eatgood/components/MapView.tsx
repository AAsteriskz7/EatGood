'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
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

const COLORS: Record<string, string> = {
  good:  '#e8893b',
  okay:  '#c49a44',
  avoid: '#d94f4f',
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
    <div className="h-full w-full rounded-[var(--radius-card)] overflow-hidden">
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

        {/* User location dot */}
        <CircleMarker
          center={center}
          radius={7}
          pathOptions={{ color: '#fff', fillColor: '#e8893b', fillOpacity: 1, weight: 2 }}
        />

        {places.map((place, i) => {
          if (!place.lat || !place.lon) return null;
          const color = COLORS[place.recommendation] ?? COLORS.good;
          const isSelected = selected?.name === place.name;
          return (
            <CircleMarker
              key={place.id || i}
              center={[place.lat, place.lon]}
              radius={isSelected ? 10 : 7}
              pathOptions={{
                color: isSelected ? '#fff' : color,
                fillColor: color,
                fillOpacity: 0.9,
                weight: isSelected ? 2.5 : 1.5,
              }}
              eventHandlers={{ click: () => onSelect(isSelected ? null : place) }}
            >
              <Popup>
                <strong className="text-sm">{place.name}</strong>
                {place.suggestedItem && <p className="text-xs mt-1">Order: {place.suggestedItem}</p>}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
