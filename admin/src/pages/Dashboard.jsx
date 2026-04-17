import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import api from '../lib/api';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const STAT_CONFIG = [
  { key: 'totalUsers', label: 'Total Users', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ), bg: 'bg-blue-50', text: 'text-blue-600', accent: 'from-blue-500 to-blue-600' },
  { key: 'totalVenues', label: 'Venues', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ), bg: 'bg-emerald-50', text: 'text-emerald-600', accent: 'from-emerald-500 to-emerald-600' },
  { key: 'activeMatches', label: 'Live Matches', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ), bg: 'bg-amber-50', text: 'text-amber-600', accent: 'from-amber-500 to-amber-600' },
  { key: 'totalBookings', label: 'Bookings', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ), bg: 'bg-indigo-50', text: 'text-indigo-600', accent: 'from-indigo-500 to-indigo-600' },
  { key: 'pendingVenues', label: 'Pending Approval', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ), bg: 'bg-red-50', text: 'text-red-600', accent: 'from-red-500 to-red-600' },
  { key: 'totalRevenue', label: 'Revenue', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ), bg: 'bg-purple-50', text: 'text-purple-600', accent: 'from-purple-500 to-purple-600', currency: true },
];

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then((r) => r.data.data),
  });

  const stats = data?.stats || {};
  const sportDistribution = data?.sportDistribution || [];
  const signupChart = data?.signupChart || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Platform overview and activity</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {STAT_CONFIG.map(({ key, label, icon, bg, text, accent, currency }) => (
          <div key={key} className="relative bg-white rounded-2xl border border-gray-200/60 p-5 overflow-hidden group hover:shadow-md transition-shadow duration-300">
            <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${accent} opacity-[0.07] group-hover:opacity-[0.12] transition`} />
            <div className={`w-10 h-10 ${bg} ${text} rounded-xl flex items-center justify-center mb-3`}>{icon}</div>
            <p className="text-2xl font-bold text-gray-900">
              {isLoading ? <span className="inline-block w-16 h-7 bg-gray-100 animate-pulse rounded" /> :
                currency ? `₹${(stats[key] || 0).toLocaleString('en-IN')}` : (stats[key] || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Signup trend */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200/60 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">User Signups <span className="text-gray-400 font-normal">(Last 7 days)</span></h2>
          {signupChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={signupChart}>
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }} />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#blueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-sm text-gray-400">No signup data yet</div>
          )}
        </div>

        {/* Sport distribution */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/60 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Sport Distribution</h2>
          {sportDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={sportDistribution} dataKey="count" nameKey="sport" cx="50%" cy="50%"
                    innerRadius={45} outerRadius={75} paddingAngle={3} strokeWidth={0}>
                    {sportDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {sportDistribution.map((s, i) => (
                  <span key={s.sport} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {s.sport} ({s.count})
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-gray-400">No venue data</div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-2xl border border-gray-200/60 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent Activity</h2>
        {recentActivity.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {recentActivity.slice(0, 10).map((a, i) => (
              <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">{a.description}</span>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{new Date(a.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">No recent activity</p>
        )}
      </div>
    </div>
  );
}
