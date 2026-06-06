import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Star, Navigation } from 'lucide-react';

const openNavigation = (placeName, userLocation) => {
  const destination = encodeURIComponent(placeName);
  const origin = userLocation ? `${userLocation.lat},${userLocation.lng}` : '';
  // Try to open in Google Maps app first, fallback to browser
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
  window.open(googleMapsUrl, '_blank');
};

const typePrompts = {
  attractions: 'Find the top 8 nearby tourist attractions, historical sites, temples, monuments, and hidden gems near this location in India. Include famous landmarks and lesser-known spots.',
  food: 'Find the top 8 nearby restaurants, street food stalls, local cuisine spots, cafes, and food markets near this location in India. Focus on authentic Indian food and local specialties.',
  stay: 'Find the top 8 nearby hotels, hostels, homestays, guest houses, and lodges near this location in India. Include budget to luxury options.',
  transport: 'Find the top 8 nearest railway stations, airports, bus stands, metro stations, and major transport hubs near this location in India.',
};

const typeEmojis = {
  attractions: '🏛️',
  food: '🍛',
  stay: '🏨',
  transport: '🚆',
};

export default function NearbyList({ location, type }) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!location) return;
    setLoading(true);
    
    base44.integrations.Core.InvokeLLM({
      prompt: `${typePrompts[type]}

Location: Latitude ${location.lat}, Longitude ${location.lng}

Return a JSON with a "places" array. Each place should have:
- name (string)
- description (short, 1-2 sentences)
- category (string)
- estimated_distance_km (number)
- rating (number 1-5)
- price_range (string, e.g. "₹200-500" or "Free")
- highlight (string, one interesting fact or tip)`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          places: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                category: { type: "string" },
                estimated_distance_km: { type: "number" },
                rating: { type: "number" },
                price_range: { type: "string" },
                highlight: { type: "string" }
              }
            }
          }
        }
      }
    }).then(result => {
      setPlaces(result?.places || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [location, type]);

  if (loading) {
    return (
      <div className="flex flex-col items-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500 mb-3" />
        <p className="text-sm text-slate-500">Discovering places near you...</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-3 mt-4">
      {places.map((place, i) => (
        <Card key={i} className="p-4 rounded-2xl border-slate-100 hover:shadow-md hover:shadow-amber-100/30 transition-all group">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-lg shrink-0">
              {typeEmojis[type]}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-slate-900 truncate group-hover:text-orange-600 transition-colors">{place.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{place.description}</p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {place.estimated_distance_km} km</span>
                {place.rating && (
                  <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {place.rating}</span>
                )}
                {place.price_range && (
                  <span className="flex items-center gap-0.5">{place.price_range}</span>
                )}
              </div>
              {place.highlight && (
                <p className="text-[11px] text-amber-600 mt-1.5 italic">💡 {place.highlight}</p>
              )}
              <Button
                size="sm"
                onClick={() => openNavigation(place.name, location)}
                className="mt-2 h-7 text-[11px] rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white w-full"
              >
                <Navigation className="w-3 h-3 mr-1" /> Navigate via Google Maps
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}