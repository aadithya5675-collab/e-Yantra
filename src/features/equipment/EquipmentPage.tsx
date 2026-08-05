import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Cpu, Calendar, PackageCheck, AlertCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { gsap, useGSAP, DURATION, EASE } from '../../lib/motion';

interface Item {
  id: number;
  name: string;
  category: string;
  serial_number: string | null;
  total_quantity: number;
  available_quantity: number;
  status: string;
}

export function EquipmentPage() {
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      const { data, error } = await supabase.from('equipment').select('*');
      if (error && error.code !== '42P01') throw error;
      return { data: (data || []) as Item[] };
    },
  });

  const bookMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { error } = await supabase.from('equipment_bookings').insert([{
        equipment_id: itemId,
        profile_id: userData.user.id,
        quantity,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
      }]);
      if (error && error.code !== '42P01') throw error;
      return {};
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setSelectedItem(null);
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to book equipment');
    },
  });

  useGSAP(
    () => {
      if (isLoading || !containerRef.current) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '.gs-equipment-card',
          { opacity: 0, scale: 0.96 },
          { opacity: 1, scale: 1, duration: DURATION.base, ease: EASE.out, stagger: 0.04, clearProps: 'all' }
        );
      });
      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [data] }
  );

  const items = data?.data || [];

  return (
    <div ref={containerRef} className="space-y-6 max-w-5xl mx-auto">
      <div className="border-b border-hairline pb-4">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Club Hardware & Equipment Lab
          </h1>
        </div>
        <p className="text-sm text-text-secondary mt-1">
          Reserve microcontrollers, sensors, actuators, and robotics testing hardware
        </p>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-text-secondary text-sm">Loading equipment catalog...</div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center border border-hairline rounded-xl bg-surface-muted/30">
          <PackageCheck className="w-10 h-10 text-text-secondary mx-auto mb-2 opacity-50" />
          <p className="text-sm text-text-secondary">No equipment items registered in the inventory yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="gs-equipment-card p-5 rounded-xl border border-hairline bg-surface-muted/40 flex flex-col justify-between hover:border-cyan-500/30 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    {item.category}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      item.status === 'available' ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {item.available_quantity} / {item.total_quantity} Available
                  </span>
                </div>
                <h3 className="text-base font-semibold text-text-primary">{item.name}</h3>
                {item.serial_number && (
                  <p className="text-xs font-mono text-text-secondary">S/N: {item.serial_number}</p>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedItem(item);
                  setErrorMsg(null);
                }}
                disabled={item.available_quantity < 1}
                className="mt-5 w-full py-2 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-xs font-semibold rounded-lg border border-cyan-400/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <Calendar className="w-3.5 h-3.5" /> Reserve Equipment
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal Overlay */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-hairline w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-hairline pb-3 mb-4">
              <h3 className="text-lg font-bold text-text-primary">Reserve {selectedItem.name}</h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-text-secondary hover:text-text-primary p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e: React.FormEvent) => {
                e.preventDefault();
                bookMutation.mutate(selectedItem.id);
              }}
              className="space-y-4"
            >
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Requested Quantity (Max: {selectedItem.total_quantity})
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedItem.total_quantity}
                  value={quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setQuantity(parseInt(e.target.value) || 1)
                  }
                  required
                  className="w-full px-3 py-2 bg-surface-muted border border-hairline rounded-lg text-sm text-text-primary focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-surface-muted border border-hairline rounded-lg text-sm text-text-primary focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-surface-muted border border-hairline rounded-lg text-sm text-text-primary focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookMutation.isPending}
                  className="px-4 py-2 bg-cyan-500 text-slate-950 font-semibold text-xs rounded-lg hover:bg-cyan-400 transition-all disabled:opacity-50"
                >
                  {bookMutation.isPending ? 'Reserving...' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
