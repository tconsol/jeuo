import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';

export default function Revenue() {
  const [period, setPeriod] = useState('week');

  const { data, isLoading } = useQuery({
    queryKey: ['owner-revenue', period],
    queryFn: () => api.get('/bookings/owner/revenue', { params: { period } }).then((r) => r.data).catch(() => ({ data: { totalRevenue: 0, chart: [] } })),
  });

  const revenue = data?.data || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Revenue</h1>
        <div className="flex gap-2">
          {['week', 'month', 'year'].map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize transition ${
                period === p ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>{p}</button>
          ))}
        </div>
      </div>

      {/* Total revenue */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-3xl font-bold text-primary-700 mt-1">
            {isLoading ? '—' : `₹${(revenue.totalRevenue || 0).toLocaleString()}`}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Bookings</p>
          <p className="text-3xl font-bold text-blue-700 mt-1">
            {isLoading ? '—' : (revenue.totalBookings || 0)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Period</p>
          <p className="text-3xl font-bold text-gray-700 mt-1 capitalize">
            {revenue.period || period}
          </p>
        </div>
      </div>

      {/* Revenue chart */}
      {revenue?.chart?.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Daily Revenue</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenue.chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }} />
              <Line type="monotone" dataKey="amount" stroke="#16a34a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
