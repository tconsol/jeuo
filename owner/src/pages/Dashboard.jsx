import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';

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

  const stats = [
    { label: 'Venues', value: s.totalVenues || 0, color: 'text-primary-600' },
    { label: 'Bookings', value: s.totalBookings || 0, color: 'text-blue-600' },
    { label: 'Revenue', value: `₹${(revenue.totalRevenue || s.totalRevenue || 0).toLocaleString()}`, color: 'text-amber-600' },
    { label: 'Active', value: s.activeVenues || 0, color: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((st) => (
          <div key={st.label} className="stat-card">
            <p className={`text-3xl font-bold ${st.color}`}>{isLoading ? '—' : st.value}</p>
            <p className="text-sm text-gray-500 mt-1">{st.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      {revenue?.chart?.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Revenue (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenue.chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }} />
              <Bar dataKey="amount" fill="#16a34a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent bookings */}
      <div className="card">
        <h2 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Recent Bookings</h2>
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}
          </div>
        ) : bookings.length === 0 ? (
          <p className="text-gray-400 text-sm">No bookings yet</p>
        ) : (
          <div className="space-y-2">
            {bookings.slice(0, 10).map((b) => (
              <div key={b._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm text-gray-900">{b.venue?.name} — {b.court?.name}</p>
                  <p className="text-xs text-gray-400">{new Date(b.date).toLocaleDateString()} · {b.slot?.startTime}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    b.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>{b.status}</span>
                  {b.amount && <p className="text-xs font-mono text-gray-500 mt-0.5">₹{b.amount}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
