import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';

const STATUS_STYLES = {
  confirmed:  { dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  locked:     { dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  cancelled:  { dot: 'bg-red-400',     badge: 'bg-red-50 text-red-700 ring-1 ring-red-100' },
  completed:  { dot: 'bg-gray-400',    badge: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200' },
};

export default function Bookings() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => api.get('/bookings/my').then((r) => r.data),
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId) => api.post(`/bookings/${bookingId}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-bookings'] }),
  });

  const bookings = data?.data?.bookings || data?.bookings || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-500 mt-1">{bookings.length} total booking{bookings.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/venues" className="btn-primary text-sm">Book a Venue</Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl shadow-card border border-gray-100 animate-pulse h-28" />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">No bookings yet</h3>
          <p className="text-gray-500 mt-2">Book a venue to get started.</p>
          <Link to="/venues" className="btn-primary inline-block mt-4 text-sm">Browse Venues</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b, i) => {
            const style = STATUS_STYLES[b.status] || STATUS_STYLES.completed;
            return (
              <motion.div
                key={b._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl p-5 shadow-card border border-gray-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />
                      <h3 className="font-semibold text-gray-900 truncate">{b.venue?.name || 'Venue'}</h3>
                    </div>
                    <div className="ml-4 space-y-0.5">
                      <p className="text-sm text-gray-500">
                        Court {b.court || 1} · {new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      {(b.slot?.startTime || b.slot?.endTime) && (
                        <p className="text-xs text-gray-400">{b.slot.startTime} – {b.slot.endTime}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${style.badge}`}>
                      {b.status}
                    </span>
                    {(b.totalAmount || b.amount) && <p className="text-sm font-semibold text-gray-700">₹{b.totalAmount || b.amount}</p>}
                  </div>
                </div>
                {b.status === 'confirmed' && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => cancelMutation.mutate(b._id)}
                      disabled={cancelMutation.isPending}
                      className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors disabled:opacity-50 px-3 py-1.5 rounded-lg hover:bg-red-50"
                    >
                      Cancel Booking
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

