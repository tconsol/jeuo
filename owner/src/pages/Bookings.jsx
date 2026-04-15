import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export default function Bookings() {
  const [filter, setFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['owner-bookings', filter],
    queryFn: () => api.get('/bookings/owner', { params: filter !== 'all' ? { status: filter } : {} }).then((r) => r.data),
  });

  const bookings = data?.data?.bookings || data?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>

      <div className="flex gap-2">
        {['all', 'confirmed', 'locked', 'cancelled'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm capitalize transition ${
              filter === f ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>{f}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="card animate-pulse h-20" />)}
        </div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase border-b border-gray-200 bg-gray-50">
                <th className="py-3 px-4">Venue / Court</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No bookings found</td></tr>
              ) : bookings.map((b) => (
                <tr key={b._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="py-3 px-4">
                    <p className="text-gray-900">{b.venue?.name}</p>
                    <p className="text-xs text-gray-400">{b.court?.name}</p>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{b.user?.name || '—'}</td>
                  <td className="py-3 px-4 text-gray-600">{new Date(b.date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-gray-500">{b.slot?.startTime} – {b.slot?.endTime}</td>
                  <td className="py-3 px-4 font-mono text-gray-900">{b.amount ? `₹${b.amount}` : '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      b.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{b.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
