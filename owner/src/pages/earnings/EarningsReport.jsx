import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { revenueService } from '../../services';
import { StatsCard } from '../../components';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

function formatCurrency(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export default function EarningsReport() {
  const [range, setRange] = useState('30d');

  const { data: summary } = useQuery({
    queryKey: ['revenue-summary', range],
    queryFn: () => revenueService.getSummary({ range }).then((r) => r.data.data),
  });

  const { data: chart } = useQuery({
    queryKey: ['revenue-chart', range],
    queryFn: () => revenueService.getChart({ range }).then((r) => r.data.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Earnings</h1>
        <select value={range} onChange={(e) => setRange(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg">
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Total Earnings" value={formatCurrency(summary?.total || 0)} icon="💰" />
        <StatsCard title="Payouts" value={formatCurrency(summary?.payouts || 0)} icon="🏦" />
        <StatsCard title="Pending" value={formatCurrency(summary?.pending || 0)} icon="⏳" />
      </div>

      {chart && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
