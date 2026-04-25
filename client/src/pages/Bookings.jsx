import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCalendar, FiClock, FiMapPin, FiPlus, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';
import api from '../lib/api';

const STATUS_CONFIG = {
  confirmed:  { label: 'Confirmed',  bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-100' },
  locked:     { label: 'On Hold',    bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-400',   border: 'border-amber-100'   },
  cancelled:  { label: 'Cancelled',  bg: 'bg-red-50',      text: 'text-red-600',     dot: 'bg-red-500',     border: 'border-red-100'     },
  completed:  { label: 'Completed',  bg: 'bg-gray-100',    text: 'text-gray-500',    dot: 'bg-gray-400',    border: 'border-gray-200'    },
  pending:    { label: 'Pending',    bg: 'bg-blue-50',     text: 'text-blue-600',    dot: 'bg-blue-400',    border: 'border-blue-100'    },
};

export default function Bookings() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => api.get('/bookings/my').then((r) => r.data.data?.bookings || r.data.bookings || []),
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId) => api.post(`/bookings/${bookingId}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-bookings'] }),
  });

  const bookings = data || [];
  const upcoming = bookings.filter((b) => ['confirmed', 'locked', 'pending'].includes(b.status));
  const past = bookings.filter((b) => ['completed', 'cancelled'].includes(b.status));

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 pb-24">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900">My Bookings</h1>
          <p className="text-gray-400 text-xs mt-0.5">{bookings.length} total booking{bookings.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/venues"
          className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition active:scale-95">
          <FiPlus size={14} /> Book Venue
        </Link>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {/* Empty */}
      {!isLoading && bookings.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <FiCalendar size={28} className="text-gray-200" />
          </div>
          <h3 className="text-base font-bold text-gray-700">No bookings yet</h3>
          <p className="text-sm text-gray-400 mt-1 mb-5">Book a venue to get started.</p>
          <Link to="/venues"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition">
            <FiPlus size={14} /> Browse Venues
          </Link>
        </div>
      )}

      {/* Upcoming */}
      {!isLoading && upcoming.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Upcoming</h2>
          <div className="space-y-3">
            {upcoming.map((b, i) => <BookingCard key={b._id} booking={b} i={i} onCancel={() => cancelMutation.mutate(b._id)} cancelling={cancelMutation.isPending} />)}
          </div>
        </section>
      )}

      {/* Past */}
      {!isLoading && past.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Past</h2>
          <div className="space-y-3">
            {past.map((b, i) => <BookingCard key={b._id} booking={b} i={i} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function BookingCard({ booking: b, i, onCancel, cancelling }) {
  const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
  const isConfirmed = b.status === 'confirmed';
  const isCancelled = b.status === 'cancelled';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isCancelled ? 'opacity-60' : ''} ${cfg.border}`}>

      {/* Status bar */}
      <div className={`h-1 ${cfg.dot.replace('bg-', 'bg-')} ${cfg.dot}`} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <FiMapPin size={14} className="text-indigo-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{b.venue?.name || 'Venue'}</p>
                {b.venue?.location?.city && (
                  <p className="text-[10px] text-gray-400">{b.venue.location.city}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-gray-500 ml-10">
              <span className="flex items-center gap-1">
                <FiCalendar size={11} />
                {new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              {(b.slot?.startTime || b.slot?.endTime) && (
                <span className="flex items-center gap-1">
                  <FiClock size={11} />
                  {b.slot.startTime} – {b.slot.endTime}
                </span>
              )}
              {b.court && (
                <span className="text-gray-400">Court {b.court}</span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            {(b.totalAmount || b.amount) && (
              <p className="text-sm font-black text-gray-800">₹{(b.totalAmount || b.amount).toLocaleString('en-IN')}</p>
            )}
          </div>
        </div>

        {isConfirmed && onCancel && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
              <FiCheck size={12} /> Booking confirmed
            </div>
            <button
              onClick={onCancel}
              disabled={cancelling}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-semibold transition px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50">
              <FiX size={12} /> Cancel
            </button>
          </div>
        )}

        {b.status === 'locked' && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-amber-600 text-xs">
            <FiAlertCircle size={12} /> Slot on hold — complete payment to confirm
          </div>
        )}
      </div>
    </motion.div>
  );
}
