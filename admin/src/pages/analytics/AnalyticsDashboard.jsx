import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../../services';
import { StatsCard } from '../../components';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { useState } from 'react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsDashboard() {
  const [range, setRange] = useState('30d');

  const { data: overview } = useQuery({ queryKey: ['admin-overview'], queryFn: () => analyticsService.getOverview().then((r) => r.data.data) });
  const { data: userGrowth } = useQuery({ queryKey: ['user-growth', range], queryFn: () => analyticsService.getUserGrowth(range).then((r) => r.data.data) });
  const { data: sports } = useQuery({ queryKey: ['sport-dist'], queryFn: () => analyticsService.getSportDistribution().then((r) => r.data.data) });
  const { data: revenue } = useQuery({ queryKey: ['admin-revenue', range], queryFn: () => analyticsService.getRevenueChart(range).then((r) => r.data.data) });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-400 mt-0.5">Insights and trends</p>
        </div>
        <div className="flex gap-1.5 bg-white border border-gray-200 rounded-xl p-1">
          {[{ v: '7d', l: '7 days' }, { v: '30d', l: '30 days' }, { v: '90d', l: '90 days' }].map(({ v, l }) => (
            <button key={v} onClick={() => setRange(v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                range === v ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total Users" value={overview?.totalUsers || 0} icon="👥" trend={overview?.userGrowth} />
        <StatsCard title="Total Venues" value={overview?.totalVenues || 0} icon="🏟️" />
        <StatsCard title="Total Bookings" value={overview?.totalBookings || 0} icon="📅" />
        <StatsCard title="Revenue" value={`₹${((overview?.totalRevenue || 0) / 1000).toFixed(0)}k`} icon="💰" trend={overview?.revenueGrowth} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {userGrowth && (
          <div className="bg-white rounded-2xl border border-gray-200/60 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">User Growth</h2>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={userGrowth}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }} />
                <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} fill="url(#userGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {sports && (
          <div className="bg-white rounded-2xl border border-gray-200/60 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Sport Distribution</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={sports} dataKey="count" nameKey="sport" cx="50%" cy="50%"
                  innerRadius={45} outerRadius={75} paddingAngle={3} strokeWidth={0}>
                  {sports.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {sports.map((s, i) => (
                <span key={s.sport} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {s.sport} ({s.count})
                </span>
              ))}
            </div>
          </div>
        )}

        {revenue && (
          <div className="bg-white rounded-2xl border border-gray-200/60 p-6 lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Revenue</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
                  formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
