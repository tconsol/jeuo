import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../services';
import { StatsCard } from '../../components';
import { formatCurrency } from '../../utils';

function formatCurrencyLocal(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export default function DashboardOverview() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['owner-stats'], queryFn: () => dashboardService.getStats().then((r) => r.data.data) });

  if (isLoading) return <div className="animate-pulse h-40 bg-gray-100 rounded-xl" />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard title="Total Revenue" value={formatCurrencyLocal(stats?.totalRevenue || 0)} icon="💰" change={stats?.revenueChange} />
      <StatsCard title="Bookings Today" value={stats?.bookingsToday || 0} icon="📅" />
      <StatsCard title="Active Venues" value={stats?.activeVenues || 0} icon="🏟️" />
      <StatsCard title="Avg Rating" value={stats?.avgRating?.toFixed(1) || ' '} icon="⭐" />
    </div>
  );
}
