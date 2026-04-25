import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SportIcon } from '../../utils/sportIcons';
import { useSelector } from 'react-redux';
import { FiPlay, FiCalendar, FiMapPin, FiChevronRight, FiRefreshCw, FiActivity } from 'react-icons/fi';
import api from '../../lib/api';

const SPORT_GRADIENT = {
  cricket:      'from-emerald-500 to-teal-600',
  football:     'from-green-500 to-emerald-600',
  basketball:   'from-orange-500 to-amber-600',
  tennis:       'from-lime-500 to-green-600',
  badminton:    'from-blue-500 to-indigo-600',
  volleyball:   'from-yellow-500 to-amber-600',
  table_tennis: 'from-red-500 to-rose-600',
};

function StatusPill({ status }) {
  if (status === 'live') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500 text-white text-[10px] font-black rounded-full animate-pulse">
      <span className="w-1.5 h-1.5 bg-white rounded-full" /> LIVE
    </span>
  );
  if (status === 'paused') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full">
      PAUSED
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full">
      <FiCalendar size={9} /> UPCOMING
    </span>
  );
}

export default function MyMatches() {
  const { user } = useSelector((s) => s.auth);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['my-matches'],
    queryFn: () => api.get('/matches/my').then((r) => r.data.data.matches || []),
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900">My Matches</h1>
          <p className="text-gray-400 text-xs mt-0.5">Live, upcoming and your recent matches</p>
        </div>
        <button onClick={() => refetch()} disabled={isFetching}
          className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition disabled:opacity-40">
          <FiRefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {/* Empty */}
      {!isLoading && (!data || data.length === 0) && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <FiActivity size={28} className="text-gray-200" />
          </div>
          <p className="text-sm font-bold text-gray-600">No matches yet</p>
          <p className="text-gray-400 text-xs mt-1 mb-6">Matches where you play or score will appear here.</p>
          <Link to="/activities"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition">
            Find a Game
          </Link>
        </div>
      )}

      {/* List */}
      {!isLoading && data && data.length > 0 && (
        <div className="space-y-3">
          {data.map((match, i) => {
            const isScorer = match.scorers?.some((s) => (s._id || s).toString() === user?._id?.toString());
            const home = match.teams?.home;
            const away = match.teams?.away;
            const gradient = SPORT_GRADIENT[match.sport] || SPORT_GRADIENT.cricket;
            const isLive = match.status === 'live' || match.status === 'paused';

            return (
              <motion.div key={match._id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                {/* Sport accent */}
                <div className={`h-1 bg-gradient-to-r ${gradient}`} />

                <div className="p-4">
                  {/* Top row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                        <SportIcon sport={match.sport} size={16} className="text-white" />
                      </div>
                      <span className="text-sm font-bold text-gray-700 capitalize">
                        {match.sport?.replace('_', ' ')}
                      </span>
                      {isScorer && (
                        <span className="text-[9px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full uppercase">
                          Scorer
                        </span>
                      )}
                    </div>
                    <StatusPill status={match.status} />
                  </div>

                  {/* Teams */}
                  <div className="flex items-center justify-between gap-4 py-2 px-3 bg-gray-50 rounded-xl mb-3">
                    <p className="font-black text-gray-900 text-sm text-right flex-1 truncate">{home?.name || 'Team A'}</p>
                    <span className="text-xs text-gray-300 font-bold shrink-0">VS</span>
                    <p className="font-black text-gray-900 text-sm text-left flex-1 truncate">{away?.name || 'Team B'}</p>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-3 mb-3 text-[10px] text-gray-400">
                    {match.venue?.name && (
                      <span className="flex items-center gap-0.5"><FiMapPin size={9} /> {match.venue.name}</span>
                    )}
                    {match.scheduledAt && (
                      <span className="flex items-center gap-0.5">
                        <FiCalendar size={9} />
                        {new Date(match.scheduledAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {isScorer && (
                      <Link to={`/scoring/${match._id}`}
                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2.5 rounded-xl transition active:scale-95">
                        <FiPlay size={13} />
                        {isLive ? 'Continue Scoring' : 'Start & Score'}
                      </Link>
                    )}
                    <Link to={`/matches/${match._id}`}
                      className={`flex items-center justify-center gap-1.5 text-sm font-semibold py-2.5 rounded-xl transition border ${
                        isScorer
                          ? 'px-4 text-gray-600 border-gray-200 hover:bg-gray-50'
                          : 'flex-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50'
                      }`}>
                      View Details <FiChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
