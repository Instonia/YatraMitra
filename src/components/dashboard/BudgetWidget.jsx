import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { IndianRupee, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

function formatINR(amount) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${Math.round(amount)}`;
}

function TripBudgetRow({ trip, itineraries }) {
  const tripItineraries = itineraries.filter((it) => it.trip_id === trip.id);
  const totalEstimated = tripItineraries.reduce((sum, it) => {
    const actCost = (it.activities || []).reduce(
      (s, a) => s + (a.cost_estimate || 0),
      0
    );
    return sum + actCost + (it.estimated_cost || 0);
  }, 0);

  const budget = trip.budget || 0;
  const hasActivities = totalEstimated > 0;
  const over = budget > 0 && totalEstimated > budget;
  const pct = budget > 0 ? Math.min((totalEstimated / budget) * 100, 100) : 0;
  const remaining = budget - totalEstimated;

  const barColor = over
    ? 'bg-rose-500'
    : pct > 80
    ? 'bg-amber-500'
    : 'bg-emerald-500';

  return (
    <Link
      to={`/TripDetail?tripId=${trip.id}`}
      className="block group rounded-2xl border border-slate-100 bg-white hover:border-orange-200 hover:shadow-md transition-all duration-200 p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm truncate group-hover:text-orange-700 transition-colors">
            {trip.title}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 capitalize">{trip.status}</p>
        </div>
        <div className="ml-3 flex-shrink-0">
          {!hasActivities ? (
            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-full">No activities</span>
          ) : over ? (
            <span className="flex items-center gap-1 text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded-full font-medium">
              <AlertTriangle className="w-3 h-3" /> Over budget
            </span>
          ) : pct > 80 ? (
            <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-full font-medium">
              <TrendingUp className="w-3 h-3" /> Nearing limit
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full font-medium">
              <CheckCircle2 className="w-3 h-3" /> On track
            </span>
          )}
        </div>
      </div>

      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Estimated cost</p>
          <p className="text-lg font-bold text-slate-800">{formatINR(totalEstimated)}</p>
        </div>
        {budget > 0 && (
          <div className="text-right">
            <p className="text-xs text-slate-400 mb-0.5">Budget</p>
            <p className="text-sm font-semibold text-slate-600">{formatINR(budget)}</p>
          </div>
        )}
      </div>

      {budget > 0 && (
        <>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${Math.min((totalEstimated / budget) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[11px] text-slate-400">{Math.round((totalEstimated / budget) * 100)}% used</span>
            <span className={`text-[11px] font-medium ${remaining < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
              {remaining < 0
                ? `${formatINR(Math.abs(remaining))} over`
                : `${formatINR(remaining)} left`}
            </span>
          </div>
        </>
      )}

      {budget === 0 && (
        <p className="text-[11px] text-slate-400 mt-1">No budget set for this trip</p>
      )}
    </Link>
  );
}

export default function BudgetWidget() {
  const { data: trips = [], isLoading: loadingTrips } = useQuery({
    queryKey: ['trips-budget'],
    queryFn: () => base44.entities.Trip.list('-created_date', 20),
  });

  const { data: itineraries = [], isLoading: loadingItineraries } = useQuery({
    queryKey: ['itineraries-budget'],
    queryFn: () => base44.entities.Itinerary.list(),
  });

  const isLoading = loadingTrips || loadingItineraries;

  const activeTrips = trips.filter(
    (t) => t.status === 'planning' || t.status === 'confirmed' || t.status === 'active'
  );

  // Overall totals
  const totalBudget = activeTrips.reduce((s, t) => s + (t.budget || 0), 0);
  const totalEstimated = activeTrips.reduce((sum, trip) => {
    const tripIts = itineraries.filter((it) => it.trip_id === trip.id);
    return sum + tripIts.reduce((s2, it) => {
      const actCost = (it.activities || []).reduce((s3, a) => s3 + (a.cost_estimate || 0), 0);
      return s2 + actCost + (it.estimated_cost || 0);
    }, 0);
  }, 0);

  const overallPct = totalBudget > 0 ? Math.min((totalEstimated / totalBudget) * 100, 100) : 0;
  const overallOver = totalBudget > 0 && totalEstimated > totalBudget;

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm shadow-orange-200">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Budget Overview</h2>
            <p className="text-[11px] text-slate-400">Activities vs. planned budget</p>
          </div>
        </div>
        {totalBudget > 0 && !isLoading && (
          <div className="text-right">
            <p className="text-xs text-slate-400">Total budget</p>
            <p className="text-base font-bold text-slate-800">{formatINR(totalBudget)}</p>
          </div>
        )}
      </div>

      {/* Summary bar (only when there's data) */}
      {!isLoading && totalBudget > 0 && activeTrips.length > 0 && (
        <div className="mb-5 bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Total estimated</p>
              <p className="text-2xl font-bold text-slate-900">{formatINR(totalEstimated)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 mb-0.5">vs budget</p>
              <p className={`text-sm font-semibold ${overallOver ? 'text-rose-600' : 'text-emerald-600'}`}>
                {overallOver
                  ? `${formatINR(totalEstimated - totalBudget)} over`
                  : `${formatINR(totalBudget - totalEstimated)} remaining`}
              </p>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                overallOver ? 'bg-rose-500' : overallPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">{Math.round(overallPct)}% of total budget used across {activeTrips.length} trip{activeTrips.length !== 1 ? 's' : ''}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && activeTrips.length === 0 && (
        <div className="text-center py-8">
          <IndianRupee className="w-8 h-8 text-amber-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No active or upcoming trips</p>
          <p className="text-xs text-slate-400 mt-1">Plan a trip to see budget tracking here</p>
        </div>
      )}

      {/* Per-trip rows */}
      {!isLoading && activeTrips.length > 0 && (
        <div className="space-y-3">
          {activeTrips.map((trip) => (
            <TripBudgetRow key={trip.id} trip={trip} itineraries={itineraries} />
          ))}
        </div>
      )}
    </div>
  );
}