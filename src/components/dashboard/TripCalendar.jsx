import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, CalendarDays, MapPin, Circle
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, isSameMonth, isSameDay, isWithinInterval,
  parseISO, isToday, addDays, isBefore, isAfter
} from 'date-fns';

const STATUS_STYLES = {
  planning:  { dot: 'bg-blue-500',   bar: 'bg-blue-100 text-blue-700 border-blue-200' },
  confirmed: { dot: 'bg-emerald-500', bar: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  active:    { dot: 'bg-orange-500',  bar: 'bg-orange-100 text-orange-700 border-orange-200' },
  completed: { dot: 'bg-slate-400',   bar: 'bg-slate-100 text-slate-500 border-slate-200' },
  cancelled: { dot: 'bg-red-400',     bar: 'bg-red-50 text-red-500 border-red-200' },
};

function getTripsForDay(trips, day) {
  return trips.filter((t) => {
    if (!t.start_date || !t.end_date) return false;
    const start = parseISO(t.start_date);
    const end = parseISO(t.end_date);
    return isWithinInterval(day, { start, end });
  });
}

function CalendarDay({ day, currentMonth, trips, selectedDay, onSelect }) {
  const dayTrips = getTripsForDay(trips, day);
  const isCurrentMonth = isSameMonth(day, currentMonth);
  const isSelected = selectedDay && isSameDay(day, selectedDay);
  const todayDay = isToday(day);

  return (
    <button
      onClick={() => onSelect(day)}
      className={`
        relative min-h-[64px] md:min-h-[80px] p-1.5 rounded-xl border text-left transition-all duration-150 w-full
        ${isSelected ? 'border-orange-400 bg-orange-50 shadow-sm shadow-orange-100' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'}
        ${!isCurrentMonth ? 'opacity-30' : ''}
      `}
    >
      {/* Day number */}
      <span className={`
        inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full mb-1
        ${todayDay ? 'bg-orange-500 text-white' : 'text-slate-600'}
      `}>
        {format(day, 'd')}
      </span>

      {/* Trip dots / mini bars */}
      <div className="space-y-0.5">
        {dayTrips.slice(0, 3).map((trip) => {
          const style = STATUS_STYLES[trip.status] || STATUS_STYLES.planning;
          const isStart = isSameDay(parseISO(trip.start_date), day);
          const isEnd = isSameDay(parseISO(trip.end_date), day);
          return (
            <div
              key={trip.id}
              className={`
                h-1.5 rounded-full ${style.dot}
                ${isStart ? 'ml-0' : ''}
                ${isEnd ? 'mr-0' : ''}
              `}
            />
          );
        })}
        {dayTrips.length > 3 && (
          <p className="text-[9px] text-slate-400 pl-0.5">+{dayTrips.length - 3}</p>
        )}
      </div>
    </button>
  );
}

function UpcomingList({ trips }) {
  const today = new Date();
  const upcoming = trips
    .filter((t) => {
      if (!t.start_date) return false;
      const end = t.end_date ? parseISO(t.end_date) : parseISO(t.start_date);
      return !isBefore(end, today) && t.status !== 'cancelled' && t.status !== 'completed';
    })
    .sort((a, b) => parseISO(a.start_date) - parseISO(b.start_date))
    .slice(0, 5);

  if (upcoming.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CalendarDays className="w-8 h-8 text-amber-300 mb-2" />
        <p className="text-sm text-slate-500">No upcoming trips</p>
        <p className="text-xs text-slate-400 mt-1">Plan a trip to see it here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {upcoming.map((trip) => {
        const style = STATUS_STYLES[trip.status] || STATUS_STYLES.planning;
        const linkPath = trip.status === 'active'
          ? `/ActiveTrip?tripId=${trip.id}`
          : `/TripDetail?tripId=${trip.id}`;
        const daysUntil = Math.ceil((parseISO(trip.start_date) - today) / (1000 * 60 * 60 * 24));
        const isActive = trip.status === 'active';

        return (
          <Link
            key={trip.id}
            to={linkPath}
            className={`flex items-center gap-3 p-3 rounded-xl border hover:shadow-sm transition-all group ${style.bar}`}
          >
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate group-hover:underline">{trip.title}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <CalendarDays className="w-3 h-3 opacity-60" />
                <span className="text-[11px] opacity-70">
                  {format(parseISO(trip.start_date), 'MMM d')}
                  {trip.end_date && ` — ${format(parseISO(trip.end_date), 'MMM d')}`}
                </span>
              </div>
              {trip.destinations?.length > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 opacity-60" />
                  <span className="text-[11px] opacity-70 truncate">
                    {trip.destinations.map((d) => d.city).join(' → ')}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-shrink-0 text-right">
              {isActive ? (
                <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">Live</span>
              ) : daysUntil <= 0 ? (
                <span className="text-[10px] font-medium opacity-70">Today</span>
              ) : daysUntil === 1 ? (
                <span className="text-[10px] font-medium opacity-70">Tomorrow</span>
              ) : (
                <span className="text-[10px] font-medium opacity-70">in {daysUntil}d</span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function DayDetail({ day, trips, onClose }) {
  const dayTrips = getTripsForDay(trips, day);
  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-slate-700">
          {isToday(day) ? 'Today' : format(day, 'EEEE, MMM d')}
        </p>
        <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600">✕ Close</button>
      </div>
      {dayTrips.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-3">No trips on this day</p>
      ) : (
        <div className="space-y-2">
          {dayTrips.map((trip) => {
            const style = STATUS_STYLES[trip.status] || STATUS_STYLES.planning;
            const linkPath = trip.status === 'active'
              ? `/ActiveTrip?tripId=${trip.id}`
              : `/TripDetail?tripId=${trip.id}`;
            return (
              <Link
                key={trip.id}
                to={linkPath}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${style.bar} hover:shadow-sm transition-all group`}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate group-hover:underline">{trip.title}</p>
                  <p className="text-[11px] opacity-70">
                    {format(parseISO(trip.start_date), 'MMM d')} — {format(parseISO(trip.end_date), 'MMM d, yyyy')}
                  </p>
                </div>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${style.bar} capitalize`}>
                  {trip.status}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TripCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'upcoming'

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['trips-calendar'],
    queryFn: () => base44.entities.Trip.list('-start_date', 50),
  });

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    const days = [];
    let d = start;
    while (!isAfter(d, end)) {
      days.push(d);
      d = addDays(d, 1);
    }
    return days;
  }, [currentMonth]);

  const handleDaySelect = (day) => {
    if (selectedDay && isSameDay(day, selectedDay)) {
      setSelectedDay(null);
    } else {
      setSelectedDay(day);
    }
  };

  const legend = [
    { label: 'Planning', style: STATUS_STYLES.planning },
    { label: 'Confirmed', style: STATUS_STYLES.confirmed },
    { label: 'Active', style: STATUS_STYLES.active },
    { label: 'Completed', style: STATUS_STYLES.completed },
  ];

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-sm shadow-indigo-200">
            <CalendarDays className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Trip Calendar</h2>
            <p className="text-[11px] text-slate-400">Upcoming trips & key dates</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'calendar' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'upcoming' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Upcoming
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          <div className="h-6 w-40 bg-slate-100 rounded-lg animate-pulse" />
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {!isLoading && activeTab === 'upcoming' && (
        <UpcomingList trips={trips} />
      )}

      {!isLoading && activeTab === 'calendar' && (
        <>
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => { setCurrentMonth(subMonths(currentMonth, 1)); setSelectedDay(null); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-semibold text-slate-800">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <button
              onClick={() => { setCurrentMonth(addMonths(currentMonth, 1)); setSelectedDay(null); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-slate-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => (
              <CalendarDay
                key={day.toISOString()}
                day={day}
                currentMonth={currentMonth}
                trips={trips}
                selectedDay={selectedDay}
                onSelect={handleDaySelect}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 pt-3 border-t border-slate-50">
            {legend.map(({ label, style }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                <span className="text-[11px] text-slate-400">{label}</span>
              </div>
            ))}
          </div>

          {/* Day detail panel */}
          {selectedDay && (
            <DayDetail
              day={selectedDay}
              trips={trips}
              onClose={() => setSelectedDay(null)}
            />
          )}
        </>
      )}
    </div>
  );
}