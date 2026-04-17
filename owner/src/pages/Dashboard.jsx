import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import api from '../lib/api';

const STAT_CONFIG = [
  {
    key: 'totalVenues', label: 'Total Venues', gradient: 'from-emerald-500 to-emerald-700', bg: 'bg-emerald-50', text: 'text-emerald-700',
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  },
  {
    key: 'totalBookings', label: 'Bookings', gradient: 'from-blue-500 to-blue-700', bg: 'bg-blue-50', text: 'text-blue-700',
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  },
  {
    key: 'revenue', label: 'Revenue', gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', text: 'text-amber-700', prefix: '₹',
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    key: 'activeVenues', label: 'Active Venues', gradient: 'from-violet-500 to-purple-700', bg: 'bg-violet-50', text: 'text-violet-700',
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
];

export default function Dashboard() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['owner-stats'],
    queryFn: () => api.get('/venues/owner/stats').then((r) => r.data),
  });

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['owner-recent-bookings'],
    queryFn: () => api.get('/bookings/owner', { params: { limit: 10 } }).then((r) => r.data),
  });

  const { data: revenueData } = useQuery({
    queryKey: ['owner-revenue-chart'],
    queryFn: () => api.get('/bookings/owner/revenue', { params: { period: 'week' } }).then((r) => r.data).catch(() => ({ data: { totalRevenue: 0, chart: [] } })),
  });

  const s = statsData?.data || {};
  const bookings = bookingsData?.data?.bookings || bookingsData?.data || [];
  const revenue = revenueData?.data || {};
  const isLoading = statsLoading || bookingsLoading;

  const getStatValue = (cfg) => {
    if (cfg.key === 'revenue') return `${cfg.prefix || ''}${(revenue.totalRevenue || s.totalRevenue || 0).toLocaleString('en-IN')}`;
    return s[cfg.key] || 0;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Overview of your venue performance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {STAT_CONFIG.map((cfg, i) => (
          <motion.div key={cfg.key}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="relative overflow-hidden bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">{cfg.label}</p>
                <p className={`text-3xl font-bold mt-1 ${cfg.text}`}>
                  {isLoading ? <span className="inline-block w-16 h-8 bg-gray-100 rounded-lg animate-pulse" /> : getStatValue(cfg)}
                </p>
              </div>
              <div className={`w-12 h-12 ${cfg.bg} rounded-xl flex items-center justify-center ${cfg.text}`}>
                {cfg.icon}
              </div>
            </div>
            <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-[0.06] bg-gradient-to-br ${cfg.gradient}`} />
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Revenue Overview</h2>
              <p className="text-xs text-gray-400 mt-0.5">Last 7 days performance</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-600">₹{(revenue.totalRevenue || s.totalRevenue || 0).toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-400">Total</p>
            </div>
          </div>
          {revenue?.chart?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenue.chart}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip contentStyle={{ background: '#fff', border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2.5} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[240px] text-gray-300 text-sm">No revenue data yet</div>
          )}
        </div>

        {/* Quick stats */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Quick Summary</h2>
            <p className="text-xs text-gray-400 mb-6">Your venue operations at a glance</p>
          </div>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-sm text-gray-600">Active Venues</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{s.activeVenues || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-600">Total Bookings</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{s.totalBookings || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-sm text-gray-600">Avg per Booking</span>
              </div>
              <span className="text-sm font-bold text-gray-900">
                ₹{s.totalBookings ? Math.round((s.totalRevenue || 0) / s.totalBookings).toLocaleString('en-IN') : 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                <span className="text-sm text-gray-600">Occupancy Rate</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{s.totalBookings ? `${Math.min(100, Math.round((s.totalBookings / ((s.totalVenues || 1) * 7)) * 100))}%` : ' '}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Recent Bookings</h2>
          <p className="text-xs text-gray-400 mt-0.5">Latest booking activity across your venues</p>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <p className="text-sm text-gray-400">No bookings yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {bookings.slice(0, 8).map((b, i) => (
              <motion.div key={b._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{b.venue?.name || 'Venue'}{b.court?.name ? `   ${b.court.name}` : ''}</p>
                    <p className="text-xs text-gray-400">{b.user?.name || 'Customer'} · {new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} {b.slot?.startTime ? `· ${b.slot.startTime}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {b.amount && <span className="text-sm font-semibold text-gray-900">₹{b.amount}</span>}
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
                    b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' :
                    b.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
                  }`}>{b.status}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}