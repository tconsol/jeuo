import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';

const PERIODS = ['week', 'month', 'year'];

export default function Revenue() {
  const [period, setPeriod] = useState('week');

  const { data, isLoading } = useQuery({
    queryKey: ['owner-revenue', period],
    queryFn: () => api.get('/bookings/owner/revenue', { params: { period } }).then((r) => r.data).catch(() => ({ data: { totalRevenue: 0, chart: [] } })),
  });

  const revenue = data?.data || {};

  const statCards = [
    { label: 'Total Revenue', value: `₹${(revenue.totalRevenue || 0).toLocaleString('en-IN')}`, icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ), bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Total Bookings', value: (revenue.totalBookings || 0).toLocaleString('en-IN'), icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ), bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Period', value: period, icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ), bg: 'bg-purple-50', text: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track your earnings</p>
        </div>
        <div className="flex gap-1.5 bg-white border border-gray-200 rounded-xl p-1">
          {PERIODS.map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition ${
                period === p ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon, bg, text }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200/60 p-5">
            <div className={`w-10 h-10 ${bg} ${text} rounded-xl flex items-center justify-center mb-3`}>{icon}</div>
            <p className="text-2xl font-bold text-gray-900 capitalize">
              {isLoading ? <span className="inline-block w-20 h-7 bg-gray-100 animate-pulse rounded" /> : value}
            </p>
            <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/60 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Revenue Trend</h2>
        {revenue?.chart?.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenue.chart}>
              <defs>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
                formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
              <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fill="url(#greenGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-sm text-gray-400">No revenue data for this period</div>
        )}
      </div>
    </div>
  );
}
