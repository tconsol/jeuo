import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../lib/api';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then((r) => r.data),
  });

  const stats = data?.stats || {};
  const sportDistribution = data?.sportDistribution || [];
  const recentActivity = data?.recentActivity || [];

  const cards = [
    { label: 'Total Users', value: stats.totalUsers || 0, color: 'text-primary-600' },
    { label: 'Total Venues', value: stats.totalVenues || 0, color: 'text-green-600' },
    { label: 'Active Matches', value: stats.activeMatches || 0, color: 'text-amber-600' },
    { label: 'Total Bookings', value: stats.totalBookings || 0, color: 'text-blue-600' },
    { label: 'Pending Venues', value: stats.pendingVenues || 0, color: 'text-red-600' },
    { label: 'Revenue (₹)', value: (stats.totalRevenue || 0).toLocaleString(), color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card text-center">
            <p className={`text-3xl font-bold ${c.color}`}>{isLoading ? '—' : c.value}</p>
            <p className="text-sm text-gray-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sport distribution */}
        {sportDistribution.length > 0 && (
          <div className="card">
            <h2 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Sport Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={sportDistribution} dataKey="count" nameKey="sport" cx="50%" cy="50%"
                  outerRadius={90} label={({ sport, count }) => `${sport}: ${count}`}>
                  {sportDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent signups chart */}
        {data?.signupChart?.length > 0 && (
          <div className="card">
            <h2 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">User Signups</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.signupChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Recent Activity</h2>
          <div className="space-y-2">
            {recentActivity.slice(0, 10).map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 text-sm">
                <span className="text-gray-700">{a.description}</span>
                <span className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
