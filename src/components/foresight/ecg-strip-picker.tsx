'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Search, X, Heart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface ECGStrip {
  id: string;
  rhythm_type: string;
  rhythm_label: string;
  image_url: string;
  leads_shown: string | null;
  difficulty: string | null;
  source_dataset: string | null;
  source_license: string | null;
}

interface ECGStripPickerProps {
  selectedStripId?: string;
  onSelect: (strip: ECGStrip | null) => void;
}

export default function ECGStripPicker({ selectedStripId, onSelect }: ECGStripPickerProps) {
  const [open, setOpen] = useState(false);
  const [strips, setStrips] = useState<ECGStrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedStrip, setSelectedStrip] = useState<ECGStrip | null>(null);

  useEffect(() => {
    async function fetchStrips() {
      const supabase = createClient();
      const { data } = await supabase
        .from('ecg_strips')
        .select('id, rhythm_type, rhythm_label, image_url, leads_shown, difficulty, source_dataset, source_license')
        .eq('is_active', true)
        .order('rhythm_type')
        .order('rhythm_label');

      if (data) {
        setStrips(data);
        if (selectedStripId) {
          const found = data.find((s) => s.id === selectedStripId);
          if (found) setSelectedStrip(found);
        }
      }
      setLoading(false);
    }
    if (open) fetchStrips();
  }, [open, selectedStripId]);

  // Group by rhythm_type
  const rhythmTypes = useMemo(() => {
    const types = new Set(strips.map((s) => s.rhythm_type));
    return ['all', ...Array.from(types).sort()];
  }, [strips]);

  // Filter
  const filtered = useMemo(() => {
    return strips.filter((s) => {
      if (filterType !== 'all' && s.rhythm_type !== filterType) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          s.rhythm_label.toLowerCase().includes(q) ||
          s.rhythm_type.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [strips, filterType, search]);

  const handleSelect = (strip: ECGStrip) => {
    setSelectedStrip(strip);
    onSelect(strip);
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedStrip(null);
    onSelect(null);
  };

  return (
    <div className="space-y-2">
      {/* Selected strip preview */}
      {selectedStrip ? (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs font-medium text-slate-700">{selectedStrip.rhythm_label}</p>
              <p className="text-[10px] text-slate-400">{selectedStrip.rhythm_type} {selectedStrip.leads_shown ? `- ${selectedStrip.leads_shown}` : ''}</p>
            </div>
            <button onClick={handleClear} className="text-slate-400 hover:text-red-500">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="rounded bg-slate-50 p-2">
            <img
              src={selectedStrip.image_url}
              alt={selectedStrip.rhythm_label}
              className="w-full h-20 object-contain"
            />
          </div>
          <p className="text-[9px] text-slate-400 mt-1">
            {selectedStrip.source_dataset} - {selectedStrip.source_license}
          </p>
        </div>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500 hover:border-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-2">
              <Heart className="h-4 w-4" />
              Attach ECG Strip (optional)
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-slate-900">Select ECG Strip</DialogTitle>
            </DialogHeader>

            {/* Filters */}
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search rhythms..."
                  className="pl-8 border-slate-200 text-sm h-9"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-xs border border-slate-200 rounded px-2 py-1.5 bg-white text-slate-700 h-9"
              >
                {rhythmTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === 'all' ? `All types (${strips.length})` : `${type} (${strips.filter(s => s.rhythm_type === type).length})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Strip grid */}
            <div className="flex-1 overflow-y-auto py-2">
              {loading ? (
                <div className="text-center text-sm text-slate-400 py-8">Loading ECG library...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center text-sm text-slate-400 py-8">No strips match your search</div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {filtered.map((strip) => (
                    <button
                      key={strip.id}
                      onClick={() => handleSelect(strip)}
                      className="rounded-lg border border-slate-200 bg-white p-2 text-left hover:border-[#1B4F72] hover:shadow-sm transition-all group"
                    >
                      <div className="rounded bg-slate-50 p-1 mb-1.5">
                        <img
                          src={strip.image_url}
                          alt={strip.rhythm_label}
                          className="w-full h-16 object-contain"
                          loading="lazy"
                        />
                      </div>
                      <p className="text-xs font-medium text-slate-700 truncate group-hover:text-[#1B4F72]">
                        {strip.rhythm_label}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Badge variant="outline" className="text-[9px] border-slate-200 text-slate-400 px-1 py-0">
                          {strip.rhythm_type}
                        </Badge>
                        {strip.leads_shown && (
                          <Badge variant="outline" className="text-[9px] border-slate-200 text-slate-400 px-1 py-0">
                            {strip.leads_shown}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
