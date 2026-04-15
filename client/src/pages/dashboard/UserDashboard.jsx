import { useQuery } from '@tanstack/react-query';
import { userService } from '../../services';
import { LoadingSpinner } from '../../components/common';
import { sportIcon } from '../../utils';

export default function UserDashboard() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['user-stats'], queryFn: () => userService.getStats().then((r) => r.data.data) });

  if (isLoading) return <LoadingSpinner className="py-20" />;

  const cards = [
    { label: 'Matches Played', value: stats?.matchesPlayed || 0, icon: '🏟️' },
    { label: 'Wins', value: stats?.wins || 0, icon: '🏆' },
    { label: 'Activities Joined', value: stats?.activitiesJoined || 0, icon: '🤝' },
    { label: 'Bookings', value: stats?.bookings || 0, icon: '📅' },
  ];

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl mb-2">{c.icon}</div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-xs text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>

      {stats?.sportBreakdown && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-3">Sport Breakdown</h2>
          <div className="space-y-2">
            {Object.entries(stats.sportBreakdown).map(([sport, count]) => (
              <div key={sport} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm">
                  {sportIcon(sport)} <span className="capitalize">{sport}</span>
                </span>
                <span className="text-sm font-medium text-gray-700">{count} matches</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
