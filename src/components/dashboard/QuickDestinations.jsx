import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const destinations = [
  { name: 'Jaipur', state: 'Rajasthan', emoji: '🏰', color: 'from-pink-500 to-rose-500' },
  { name: 'Goa', state: 'Goa', emoji: '🏖️', color: 'from-cyan-500 to-blue-500' },
  { name: 'Varanasi', state: 'Uttar Pradesh', emoji: '🕉️', color: 'from-amber-500 to-orange-500' },
  { name: 'Manali', state: 'Himachal Pradesh', emoji: '🏔️', color: 'from-emerald-500 to-teal-500' },
  { name: 'Kerala', state: 'Kerala', emoji: '🌴', color: 'from-green-500 to-lime-500' },
  { name: 'Udaipur', state: 'Rajasthan', emoji: '🏯', color: 'from-violet-500 to-purple-500' },
];

export default function QuickDestinations() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Popular Destinations</h2>
        <Link to="/Explore" className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1">
          Explore more <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {destinations.map(dest => (
          <Link
            key={dest.name}
            to={`/PlanTrip?destination=${dest.name}`}
            className="group relative overflow-hidden rounded-2xl p-4 bg-white border border-slate-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/50 transition-all duration-300"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${dest.color} flex items-center justify-center mb-3 text-lg group-hover:scale-110 transition-transform`}>
              {dest.emoji}
            </div>
            <h3 className="font-semibold text-sm text-slate-900">{dest.name}</h3>
            <p className="text-[11px] text-slate-400">{dest.state}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}