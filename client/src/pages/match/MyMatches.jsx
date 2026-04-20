import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { SportIcon } from '../../utils/sportIcons';
import { useSelector } from 'react-redux';
import { FiPlay, FiCalendar, FiMapPin, FiChevronRight } from 'react-icons/fi';
import api from '../../lib/api';

// sport icons via SportIcon component

function StatusPill({ status }) {
  if (status === 'live' || status === 'paused') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-red-50 text-red-600 text-xs font-semibold rounded-full ring-1 ring-red-100">
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
        {status === 'paused' ? 'PAUSED' : 'LIVE'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-50 text-amber-600 text-xs font-semibold rounded-full ring-1 ring-amber-100">
      <FiCalendar size={10} />
      SCHEDULED
    </span>
  );
}

export default function MyMatches() {
  const { user } = useSelector((s) => s.auth);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-matches'],
    queryFn: async () => {
      const { data } = await api.get('/matches/my');
      return (data.data || data).matches || [];
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">My Matches</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your upcoming &amp; live matches</p>
        </div>
        <button
          onClick={() => refetch()}
          className="text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!data || data.length === 0) && (
        <div className="text-center py-20">
          <div className="flex justify-center mb-4"><SportIcon sport="cricket" size={52} className="text-gray-300" /></div>
          <h3 className="text-lg font-semibold text-gray-700">No upcoming matches</h3>
          <p className="text-gray-400 text-sm mt-1 mb-6">
            You'll see matches here where you're a player or scorer.
          </p>
          <Link to="/activities" className="btn-primary text-sm">
            Find a game
          </Link>
        </div>
      )}

      {!isLoading && data && data.length > 0 && (
        <div className="space-y-3">
          {data.map((match) => {
            const isScorer = match.scorers?.some(
              (s) => (s._id || s).toString() === user?._id?.toString()
            );
            const home = match.teams?.home;
            const away = match.teams?.away;

            return (
              <div
                key={match._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3"
              >
                {/* Top row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <SportIcon sport={match.sport} size={18} className="text-gray-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 capitalize">
                      {match.sport?.replace('_', ' ')}
                    </span>
                  </div>
                  <StatusPill status={match.status} />
                </div>

                {/* Teams */}
                <div className="flex items-center justify-center gap-4 py-1">
                  <span className="font-bold text-gray-800 text-sm text-right flex-1 truncate">
                    {home?.name || 'Team A'}
                  </span>
                  <span className="text-xs text-gray-400 font-medium px-2 shrink-0">VS</span>
                  <span className="font-bold text-gray-800 text-sm text-left flex-1 truncate">
                    {away?.name || 'Team B'}
                  </span>
                </div>

                {/* Meta */}
                {match.venue && (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <FiMapPin size={11} />
                    {match.venue.name}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  {isScorer && (
                    <Link
                      to={`/scoring/${match._id}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                    >
                      <FiPlay size={14} />
                      {match.status === 'scheduled' ? 'Start & Score' : 'Continue Scoring'}
                    </Link>
                  )}
                  <Link
                    to={`/matches/${match._id}`}
                    className={`flex items-center justify-center gap-1.5 text-sm font-medium py-2.5 rounded-xl transition-colors border ${
                      isScorer
                        ? 'px-4 text-gray-600 border-gray-200 hover:bg-gray-50'
                        : 'flex-1 text-primary-600 border-primary-200 hover:bg-primary-50'
                    }`}
                  >
                    View Details
                    <FiChevronRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
