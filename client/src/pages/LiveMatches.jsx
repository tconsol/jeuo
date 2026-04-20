import { useQuery } from '@tanstack/react-query';
import { SportIcon } from '../utils/sportIcons';
import { Link } from 'react-router-dom';
import { FiTv, FiMapPin, FiClock } from 'react-icons/fi';
import api from '../lib/api';

// sport icons handled by SportIcon component

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-red-50 text-red-600 text-xs font-semibold rounded-full ring-1 ring-red-100">
      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
      LIVE
    </span>
  );
}

export default function LiveMatches() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['matches', 'live'],
    queryFn: async () => {
      const { data } = await api.get('/matches/live');
      return data.data?.matches || data.matches || [];
    },
    refetchInterval: 5000, // auto-refresh every 5s
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 flex items-center gap-2">
            <FiTv className="text-red-500" /> Live Now
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time match scores</p>
        </div>
        <button
          onClick={() => refetch()}
          className="text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!data || data.length === 0) && (
        <div className="text-center py-20">
          <div className="flex justify-center mb-4"><FiTv size={52} className="text-gray-300" /></div>
          <h3 className="text-lg font-semibold text-gray-700">No live matches right now</h3>
          <p className="text-gray-400 text-sm mt-1">Check back soon or start a match to score live.</p>
          <Link to="/activities" className="mt-6 inline-flex btn-primary text-sm">
            Find a game
          </Link>
        </div>
      )}

      {/* Match cards */}
      {!isLoading && data && data.length > 0 && (
        <div className="space-y-3">
          {data.map((match) => {
            const home = match.teams?.home;
            const away = match.teams?.away;
            const score = match.scoreSnapshot;
            return (
              <Link
                key={match._id}
                to={`/scoring/${match._id}`}
                className="block bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover transition-all duration-200 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <SportIcon sport={match.sport} size={18} className="text-gray-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 capitalize">{match.sport}</span>
                  </div>
                  <LiveBadge />
                </div>

                {/* Teams + score */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{home?.name || 'Home'}</p>
                    {match.sport === 'cricket' && score?.home && (
                      <p className="text-sm text-gray-500">{score.home.runs}/{score.home.wickets} ({score.home.overs} ov)</p>
                    )}
                    {match.sport === 'football' && score?.home && (
                      <p className="text-sm text-gray-500">{score.home.goals} goals</p>
                    )}
                  </div>
                  <span className="mx-3 text-gray-300 font-bold">vs</span>
                  <div className="flex-1 min-w-0 text-right">
                    <p className="font-semibold text-gray-900 truncate">{away?.name || 'Away'}</p>
                    {match.sport === 'cricket' && score?.away && (
                      <p className="text-sm text-gray-500">{score.away.runs}/{score.away.wickets} ({score.away.overs} ov)</p>
                    )}
                    {match.sport === 'football' && score?.away && (
                      <p className="text-sm text-gray-500">{score.away.goals} goals</p>
                    )}
                  </div>
                </div>

                {/* Venue / time */}
                {match.venue && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                    <FiMapPin className="shrink-0" />
                    <span className="truncate">{match.venue.name}</span>
                  </div>
                )}
                {match.startedAt && (
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                    <FiClock className="shrink-0" />
                    <span>Started {new Date(match.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
