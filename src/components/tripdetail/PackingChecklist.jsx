import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Luggage, Plus, Trash2, CheckCircle2, Circle, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const DEFAULT_CATEGORIES = ['Clothing', 'Toiletries', 'Documents', 'Electronics', 'Medicines', 'Misc'];

const CATEGORY_COLORS = {
  Clothing:    'bg-pink-100 text-pink-700',
  Toiletries:  'bg-cyan-100 text-cyan-700',
  Documents:   'bg-amber-100 text-amber-700',
  Electronics: 'bg-violet-100 text-violet-700',
  Medicines:   'bg-red-100 text-red-700',
  Misc:        'bg-slate-100 text-slate-600',
};

const AI_DEFAULTS = {
  Clothing:    ['T-Shirts (3)', 'Trousers / Jeans', 'Underwear', 'Socks', 'Warm jacket', 'Comfortable shoes', 'Flip-flops'],
  Toiletries:  ['Toothbrush & paste', 'Shampoo', 'Soap / body wash', 'Deodorant', 'Sunscreen SPF 50', 'Face wash'],
  Documents:   ['Aadhar / Passport', 'Booking confirmations', 'Travel insurance', 'Emergency contacts'],
  Electronics: ['Phone charger', 'Power bank', 'Earphones', 'Camera'],
  Medicines:   ['Pain reliever', 'Anti-diarrheal', 'ORS sachets', 'Personal prescription meds'],
  Misc:        ['Water bottle', 'Snacks', 'Notebook & pen', 'Hand sanitizer', 'Face mask'],
};

function uid() {
  return Math.random().toString(36).slice(2);
}

export default function PackingChecklist({ trip }) {
  const queryClient = useQueryClient();
  const checklist = trip.packing_checklist || [];
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState('Misc');
  const [aiLoading, setAiLoading] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (items) => base44.entities.Trip.update(trip.id, { packing_checklist: items }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trip', trip.id] }),
  });

  const toggle = (id) => {
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, packed: !item.packed } : item
    );
    saveMutation.mutate(updated);
  };

  const addItem = (e) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    const updated = [...checklist, { id: uid(), label: newLabel.trim(), category: newCategory, packed: false }];
    saveMutation.mutate(updated);
    setNewLabel('');
  };

  const removeItem = (id) => {
    saveMutation.mutate(checklist.filter((item) => item.id !== id));
  };

  const loadDefaults = async () => {
    setAiLoading(true);
    try {
      const interests = trip.interests || [];
      const tripType = trip.trip_type || 'solo';
      const prompt = `Generate a smart packing checklist for a ${tripType} trip to India with interests: ${interests.join(', ') || 'general sightseeing'}.
Return a JSON object with keys: Clothing, Toiletries, Documents, Electronics, Medicines, Misc.
Each key maps to an array of short item name strings (max 8 items per category).
Keep items practical and India-travel relevant.`;
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            Clothing:    { type: 'array', items: { type: 'string' } },
            Toiletries:  { type: 'array', items: { type: 'string' } },
            Documents:   { type: 'array', items: { type: 'string' } },
            Electronics: { type: 'array', items: { type: 'string' } },
            Medicines:   { type: 'array', items: { type: 'string' } },
            Misc:        { type: 'array', items: { type: 'string' } },
          },
        },
      });
      const generated = result || AI_DEFAULTS;
      const items = Object.entries(generated).flatMap(([cat, labels]) =>
        (labels || []).map((label) => ({ id: uid(), label, category: cat, packed: false }))
      );
      saveMutation.mutate([...checklist, ...items]);
      toast.success('Smart checklist added!');
    } catch {
      // fallback to static defaults
      const items = Object.entries(AI_DEFAULTS).flatMap(([cat, labels]) =>
        labels.map((label) => ({ id: uid(), label, category: cat, packed: false }))
      );
      saveMutation.mutate([...checklist, ...items]);
      toast.success('Default checklist added!');
    } finally {
      setAiLoading(false);
    }
  };

  const clearAll = () => saveMutation.mutate([]);

  // Group by category
  const grouped = DEFAULT_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = checklist.filter((i) => i.category === cat);
    return acc;
  }, {});
  const otherItems = checklist.filter((i) => !DEFAULT_CATEGORIES.includes(i.category));
  if (otherItems.length) grouped['Misc'] = [...(grouped['Misc'] || []), ...otherItems];

  const totalPacked = checklist.filter((i) => i.packed).length;
  const total = checklist.length;
  const pct = total > 0 ? Math.round((totalPacked / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-sm">
            <Luggage className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Packing Checklist</h2>
            {total > 0 && (
              <p className="text-[11px] text-slate-400">{totalPacked}/{total} packed · {pct}%</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {total > 0 && (
            <button onClick={clearAll} className="text-[11px] text-slate-400 hover:text-red-500 transition-colors">
              Clear all
            </button>
          )}
          {total === 0 && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl text-xs border-teal-200 text-teal-700 hover:bg-teal-50"
              onClick={loadDefaults}
              disabled={aiLoading}
            >
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
              AI Suggest
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : 'bg-teal-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Empty state */}
      {total === 0 && !aiLoading && (
        <div className="text-center py-6">
          <Luggage className="w-8 h-8 text-slate-200 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No items yet</p>
          <p className="text-xs text-slate-400 mt-1">Use AI Suggest or add items manually below</p>
        </div>
      )}

      {/* Grouped items */}
      {DEFAULT_CATEGORIES.map((cat) => {
        const items = grouped[cat] || [];
        if (!items.length) return null;
        const colorClass = CATEGORY_COLORS[cat] || 'bg-slate-100 text-slate-600';
        return (
          <div key={cat}>
            <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mb-2 ${colorClass}`}>{cat}</span>
            <div className="space-y-1.5">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-2.5 group">
                  <button onClick={() => toggle(item.id)} className="flex-shrink-0 text-slate-300 hover:text-teal-500 transition-colors">
                    {item.packed
                      ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      : <Circle className="w-5 h-5" />}
                  </button>
                  <span className={`flex-1 text-sm transition-all ${item.packed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    {item.label}
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Add item form */}
      <form onSubmit={addItem} className="flex gap-2 pt-2 border-t border-slate-50">
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="text-xs border border-slate-200 rounded-xl px-2 py-2 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-300"
        >
          {DEFAULT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Add item…"
          className="flex-1 rounded-xl text-sm h-9"
        />
        <Button type="submit" size="sm" className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-3">
          <Plus className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}