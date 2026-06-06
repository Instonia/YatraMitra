import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';

export default function ExploreMap({ center, markers = [] }) {
  if (!center) return null;

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={14}
      className="h-full w-full"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[center.lat, center.lng]}>
        <Popup>📍 You are here</Popup>
      </Marker>
      <Circle center={[center.lat, center.lng]} radius={2000} pathOptions={{ color: '#FF6B35', fillColor: '#FF6B35', fillOpacity: 0.05 }} />
      {markers.map((m, i) => (
        <Marker key={i} position={[m.lat, m.lng]}>
          <Popup>{m.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}