import { useQuery } from '@tanstack/react-query';
import { matchService } from '../../services';
import { LoadingSpinner, EmptyState, Badge } from '../../components/common';
import { Link } from 'react-router-dom';
import { formatDate, sportIcon } from '../../utils';

export default function MatchHistory() {
  const { data: matches, isLoading } = useQuery({
    queryKey: ['match-history'],
    queryFn: () => matchService.getAll({ status: 'completed', limit: 50 }).then((r) => r.data.matches),
  });

  if (isLoading) return <LoadingSpinner className="py-20" />;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Match History</h1>
      {!matches?.length ? (
        <EmptyState icon="🏅" title="No matches yet" description="Your completed matches will appear here." />
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <Link key={m._id} to={`/matches/${m._id}`} className="block bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2">
                  <span className="text-lg">{sportIcon(m.sport)}</span>
                  <span className="font-medium text-gray-900">{m.teams?.home?.name || 'Team A'} vs {m.teams?.away?.name || 'Team B'}</span>
                </span>
                <Badge variant={m.result?.winner === 'home' || m.result?.winner === 'away' ? 'success' : 'default'}>
                  {m.result?.summary || m.result?.winner || 'Draw'}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">{formatDate(m.date)} • {m.venue?.name}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
