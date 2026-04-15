import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../services';
import { StatsCard } from '../../components';

export default function AdminDashboardHome() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => dashboardService.getStats().then((r) => r.data.data),
  });

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-28 bg-gray-100 rounded-xl" /><div className="h-28 bg-gray-100 rounded-xl" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Users" value={stats?.totalUsers || 0} icon="👥" trend={stats?.userGrowth} />
        <StatsCard title="Venues" value={stats?.totalVenues || 0} icon="🏟️" />
        <StatsCard title="Pending Approvals" value={stats?.pendingApprovals || 0} icon="⏳" />
        <StatsCard title="Active Matches" value={stats?.activeMatches || 0} icon="🏏" />
      </div>

      {stats?.recentActivity && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {stats.recentActivity.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0" />
                <span className="text-gray-700">{item.message}</span>
                <span className="text-gray-400 text-xs ml-auto">{new Date(item.createdAt).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
