import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiSearch, FiCalendar, FiMapPin, FiAward } from 'react-icons/fi';
import { SportIcon } from '../../utils/sportIcons';
import api from '../../lib/api';

const SPORTS = ['all', 'cricket', 'football', 'basketball', 'tennis', 'badminton', 'volleyball'];

export default function MatchHistory() {
  const [sport, setSport] = useState('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['match-history'],
    queryFn: () =>
      api.get('/matches', { params: { status: 'completed', limit: 50 } })
        .then((r) => r.data.data.matches || []),
  });

  const matches = (data || []).filter((m) => {
    const matchesSport = sport === 'all' || m.sport === sport;
    const matchesSearch =
      !search ||
      m.teams?.home?.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.teams?.away?.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.venue?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesSport && matchesSearch;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link to="/matches" className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500">
          <FiArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Match History</h1>
          <p className="text-gray-400 text-xs mt-0.5">{data?.length || 0} completed matches</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search teams or venues…"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        />
      </div>

      {/* Sport pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {SPORTS.map((s) => (
          <button key={s} onClick={() => setSport(s)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              sport === s
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
            }`}>
            {s !== 'all' && <SportIcon sport={s} size={12} className={sport === s ? 'text-white' : 'text-gray-400'} />}
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && matches.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <FiAward size={28} className="text-gray-200" />
          </div>
          <p className="text-sm font-bold text-gray-600">No matches found</p>
          <p className="text-xs text-gray-400 mt-1">
            {search ? `No results for "${search}"` : 'Completed matches will appear here.'}
          </p>
        </div>
      )}

      {/* List */}
      {!isLoading && matches.length > 0 && (
        <div className="space-y-3">
          {matches.map((m, i) => {
            const winner = m.result?.winner;
            const summary = m.result?.summary;
            return (
              <motion.div key={m._id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}>
                <Link to={`/matches/${m._id}`}
                  className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <SportIcon sport={m.sport} size={20} className="text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
                      {m.teams?.home?.name || 'Team A'} <span className="text-gray-400 font-normal">vs</span> {m.teams?.away?.name || 'Team B'}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {m.scheduledAt && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <FiCalendar size={9} />
                          {new Date(m.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      {m.venue?.name && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <FiMapPin size={9} /> {m.venue.name}
                        </span>
                      )}
                    </div>
                  </div>
                  {summary ? (
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                        {summary.length > 20 ? summary.slice(0, 20) + '…' : summary}
                      </span>
                    </div>
                  ) : winner ? (
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full flex-shrink-0 capitalize">
                      {winner} won
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-gray-400 flex-shrink-0">Draw</span>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
