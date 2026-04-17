import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

const FILTERS = ['all', 'confirmed', 'locked', 'cancelled'];

export default function Bookings() {
  const [filter, setFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['owner-bookings', filter],
    queryFn: () => api.get('/bookings/owner', { params: filter !== 'all' ? { status: filter } : {} }).then((r) => r.data),
  });

  const bookings = data?.data?.bookings || data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-sm text-gray-400 mt-0.5">{bookings.length} bookings</p>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${
              filter === f ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            }`}>{f}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl border border-gray-200/60 animate-pulse h-20" />)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wider border-b border-gray-100">
                <th className="py-3.5 px-5 font-medium">Venue / Court</th>
                <th className="py-3.5 px-5 font-medium">Customer</th>
                <th className="py-3.5 px-5 font-medium">Date</th>
                <th className="py-3.5 px-5 font-medium">Time</th>
                <th className="py-3.5 px-5 font-medium">Amount</th>
                <th className="py-3.5 px-5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No bookings found</td></tr>
              ) : bookings.map((b) => (
                <tr key={b._id} className="hover:bg-gray-50/50 transition">
                  <td className="py-3.5 px-5">
                    <p className="font-medium text-gray-900">{b.venue?.name}</p>
                    <p className="text-xs text-gray-400">{b.court?.name}</p>
                  </td>
                  <td className="py-3.5 px-5 text-gray-600">{b.user?.name || ' '}</td>
                  <td className="py-3.5 px-5 text-gray-500 text-xs">{new Date(b.date).toLocaleDateString()}</td>
                  <td className="py-3.5 px-5 text-gray-400 text-xs">{b.slot?.startTime} – {b.slot?.endTime}</td>
                  <td className="py-3.5 px-5 font-medium text-gray-900">{b.amount ? `₹${b.amount.toLocaleString('en-IN')}` : ' '}</td>
                  <td className="py-3.5 px-5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                      b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' :
                      b.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        b.status === 'confirmed' ? 'bg-emerald-500' :
                        b.status === 'cancelled' ? 'bg-red-500' :
                        'bg-amber-500'
                      }`} />
                      {b.status}
                    </span>
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
