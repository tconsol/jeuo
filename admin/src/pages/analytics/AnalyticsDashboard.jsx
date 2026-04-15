import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../../services';
import { StatsCard } from '../../components';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { useState } from 'react';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6'];

export default function AnalyticsDashboard() {
  const [range, setRange] = useState('30d');

  const { data: overview } = useQuery({ queryKey: ['admin-overview'], queryFn: () => analyticsService.getOverview().then((r) => r.data.data) });
  const { data: userGrowth } = useQuery({ queryKey: ['user-growth', range], queryFn: () => analyticsService.getUserGrowth(range).then((r) => r.data.data) });
  const { data: sports } = useQuery({ queryKey: ['sport-dist'], queryFn: () => analyticsService.getSportDistribution().then((r) => r.data.data) });
  const { data: revenue } = useQuery({ queryKey: ['admin-revenue', range], queryFn: () => analyticsService.getRevenueChart(range).then((r) => r.data.data) });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
        <select value={range} onChange={(e) => setRange(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg">
          <option value="7d">7 days</option>
          <option value="30d">30 days</option>
          <option value="90d">90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total Users" value={overview?.totalUsers || 0} icon="👥" trend={overview?.userGrowth} />
        <StatsCard title="Total Venues" value={overview?.totalVenues || 0} icon="🏟️" />
        <StatsCard title="Total Bookings" value={overview?.totalBookings || 0} icon="📅" />
        <StatsCard title="Revenue" value={`₹${((overview?.totalRevenue || 0) / 1000).toFixed(0)}k`} icon="💰" trend={overview?.revenueGrowth} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {userGrowth && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="font-semibold mb-4">User Growth</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {sports && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="font-semibold mb-4">Sport Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={sports} dataKey="count" nameKey="sport" cx="50%" cy="50%" outerRadius={90} label={({ sport }) => sport}>
                  {sports.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {revenue && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 lg:col-span-2">
            <h2 className="font-semibold mb-4">Revenue</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
