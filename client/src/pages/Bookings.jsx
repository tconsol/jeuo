import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../lib/api';

const STATUS_COLORS = {
  confirmed: 'badge-success',
  locked: 'badge-warning',
  cancelled: 'badge-danger',
  completed: 'badge-default',
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

  const bookings = data?.bookings || [];

  return (
    <div className="space-y-6 max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-display font-bold text-gray-900">My Bookings</h1>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl shadow-card animate-pulse h-28" />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📋</span>
          </div>
          <p className="text-gray-500">No bookings yet</p>
          <a href="/venues" className="btn-primary inline-block mt-4 text-sm">Browse Venues</a>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b, i) => (
            <motion.div key={b._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }} className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{b.venue?.name || 'Venue'}</h3>
                  <p className="text-sm text-gray-500">
                    {b.court?.name || 'Court'} · {new Date(b.date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {b.slot?.startTime} – {b.slot?.endTime}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`badge ${STATUS_COLORS[b.status] || 'badge-default'}`}>{b.status}</span>
                  {b.amount && <p className="text-sm font-mono mt-1 text-gray-700">₹{b.amount}</p>}
                </div>
              </div>
              {b.status === 'confirmed' && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => cancelMutation.mutate(b._id)}
                    disabled={cancelMutation.isPending}
                    className="text-sm text-red-500 hover:text-red-600 transition disabled:opacity-50">
                    Cancel Booking
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
