import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, IndianRupee, ChevronRight, Users } from 'lucide-react';
import { format } from 'date-fns';

const statusConfig = {
  planning: { label: 'Planning', color: 'bg-blue-100 text-blue-700' },
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-700' },
  active: { label: 'Active', color: 'bg-orange-100 text-orange-700' },
  completed: { label: 'Completed', color: 'bg-slate-100 text-slate-600' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-600' },
};

export default function TripCard({ trip }) {
  const status = statusConfig[trip.status] || statusConfig.planning;
  const linkPath = trip.status === 'active' 
    ? `/ActiveTrip?tripId=${trip.id}` 
    : `/TripDetail?tripId=${trip.id}`;

  return (
    <Link to={linkPath}>
      <Card className="p-5 hover:shadow-lg hover:shadow-amber-100/50 transition-all duration-300 border-slate-100 hover:border-orange-200 rounded-2xl group cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">{trip.title}</h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
              <Calendar className="w-3 h-3" />
              {trip.start_date && format(new Date(trip.start_date), 'MMM d')} — {trip.end_date && format(new Date(trip.end_date), 'MMM d, yyyy')}
            </div>
          </div>
          <Badge className={`${status.color} text-[10px] font-medium rounded-lg`}>{status.label}</Badge>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          {trip.destinations?.length > 0 && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-orange-400" />
              {trip.destinations.map(d => d.city).join(' → ')}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            {trip.budget && (
              <span className="flex items-center gap-0.5">
                <IndianRupee className="w-3 h-3" />
                {trip.budget.toLocaleString('en-IN')}
              </span>
            )}
            {trip.travelers_count && (
              <span className="flex items-center gap-0.5">
                <Users className="w-3 h-3" />
                {trip.travelers_count}
              </span>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-400 transition-colors" />
        </div>
      </Card>
    </Link>
  );
}