import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { SportIcon } from '../utils/sportIcons';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  FiCalendar, FiUsers, FiAward, FiClock,
  FiMapPin, FiChevronRight, FiPlus, FiSearch, FiFilter,
} from 'react-icons/fi';
import api from '../lib/api';

const SPORTS = [
  { value: 'all', label: 'All Sports' },
  { value: 'cricket', label: 'Cricket' },
  { value: 'football', label: 'Football' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'tennis', label: 'Tennis' },
  { value: 'badminton', label: 'Badminton' },
  { value: 'volleyball', label: 'Volleyball' },
];

const STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'registration_open', label: 'Open' },
  { value: 'in_progress', label: 'Live' },
  { value: 'completed', label: 'Completed' },
];

const SPORT_GRADIENTS = {
  cricket:      'from-emerald-500 to-green-600',
  football:     'from-blue-500 to-indigo-600',
  basketball:   'from-orange-500 to-red-500',
  tennis:       'from-yellow-400 to-amber-500',
  badminton:    'from-violet-500 to-purple-600',
  volleyball:   'from-pink-500 to-rose-600',
  table_tennis: 'from-cyan-500 to-teal-600',
};

const STATUS_BADGE = {
  registration_open:   { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500',            label: 'Open'   },
  registration_closed: { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500',              label: 'Closed' },
  in_progress:         { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500 animate-pulse', label: 'Live'   },
  completed:           { bg: 'bg-gray-100',    text: 'text-gray-500',    dot: 'bg-gray-400',               label: 'Done'   },
  draft:               { bg: 'bg-gray-100',    text: 'text-gray-400',    dot: 'bg-gray-300',               label: 'Draft'  },
};

export default function Tournaments() {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const [sport,  setSport]  = useState(searchParams.get('sport')  || 'all');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['tournaments', sport, status],
    queryFn: () => {
      const params = {};
      if (sport  !== 'all') params.sport  = sport;
      if (status !== 'all') params.status = status;
      return api.get('/tournaments', { params }).then((r) => r.data);
    },
  });

  const allTournaments = data?.data?.tournaments || [];
  const total = data?.data?.total || 0;
  const tournaments = search
    ? allTournaments.filter((t) => t.name?.toLowerCase().includes(search.toLowerCase()))
    : allTournaments;

  const setFilter = (key, val) => {
    if (key === 'sport')  setSport(val);
    if (key === 'status') setStatus(val);
    const p = new URLSearchParams(searchParams);
    if (val === 'all') p.delete(key); else p.set(key, val);
    setSearchParams(p);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero ──────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-700 via-purple-700 to-violet-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FiAward size={18} className="text-yellow-300" />
                <span className="text-yellow-300 text-xs font-bold tracking-widest uppercase">Competitions</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black">Tournaments</h1>
              <p className="text-white/65 mt-2 text-sm max-w-md">
                Compete, win trophies, and climb the leaderboard. Join an existing tournament or create your own.
              </p>
              {total > 0 && (
                <p className="text-white/40 text-xs mt-3">{total} tournaments available</p>
              )}
            </div>
            {isAuthenticated && (
              <button
                onClick={() => navigate('/tournaments/create')}
                className="flex items-center gap-2 bg-white text-indigo-700 font-bold px-6 py-3 rounded-2xl hover:bg-indigo-50 transition-all active:scale-95 shadow-lg self-start sm:self-auto flex-shrink-0"
              >
                <FiPlus size={18} />
                Create Tournament
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-5">

        {/* ── Search ───────────────────────────────────── */}
        <div className="relative">
          <FiSearch size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tournaments by name…"
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm"
          />
        </div>

        {/* ── Sport filter ─────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SPORTS.map(({ value, label }) => (
            <button key={value} onClick={() => setFilter('sport', value)}
              className={`flex items-center gap-1.5 flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                sport === value
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}>
              {value !== 'all' && <SportIcon sport={value} size={13} />}
              {label}
            </button>
          ))}
        </div>

        {/* ── Status filter ────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          <FiFilter size={13} className="text-gray-400" />
          {STATUSES.map(({ value, label }) => (
            <button key={value} onClick={() => setFilter('status', value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                status === value
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Cards ────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                <div className="h-28 bg-gray-100" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="flex gap-2 pt-2">
                    <div className="h-7 bg-gray-100 rounded-lg w-16" />
                    <div className="h-7 bg-gray-100 rounded-lg w-16" />
                    <div className="h-7 bg-gray-100 rounded-lg w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <FiAward size={36} className="text-indigo-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No tournaments found</h3>
            <p className="text-gray-500 mt-2 text-sm max-w-xs mx-auto">
              Try a different sport or status filter, or be the first to create one.
            </p>
            {isAuthenticated && (
              <button
                onClick={() => navigate('/tournaments/create')}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-2xl hover:bg-indigo-700 transition"
              >
                <FiPlus size={16} /> Create Tournament
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tournaments.map((t, i) => {
              const gradient  = SPORT_GRADIENTS[t.sport] || 'from-indigo-500 to-purple-600';
              const badge     = STATUS_BADGE[t.status]   || STATUS_BADGE.draft;
              const daysLeft  = t.registrationDeadline
                ? Math.ceil((new Date(t.registrationDeadline) - new Date()) / 86400000)
                : null;
              const slotsLeft = t.maxTeams - (t.teams?.length || 0);

              return (
                <motion.div key={t._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}>
                  <Link to={`/tournaments/${t._id}`}
                    className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300">

                    {/* Gradient header */}
                    <div className={`bg-gradient-to-br ${gradient} p-5 relative overflow-hidden min-h-[106px]`}>
                      <div className="absolute -bottom-6 -right-6 opacity-10 pointer-events-none">
                        <SportIcon sport={t.sport} size={90} />
                      </div>
                      <div className="relative z-10 flex items-start justify-between">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${badge.bg} ${badge.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-1.5">
                          <SportIcon sport={t.sport} size={16} />
                        </div>
                      </div>
                      <h3 className="text-white font-black text-lg mt-3 leading-snug line-clamp-2 drop-shadow-sm">
                        {t.name}
                      </h3>
                      <p className="text-white/65 text-xs mt-1 capitalize">
                        {t.sport?.replace('_', ' ')} · {t.format?.replace(/_/g, ' ')}
                      </p>
                    </div>

                    {/* Body */}
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="text-center p-2.5 bg-gray-50 rounded-xl">
                          <p className="text-sm font-black text-gray-900">{t.entryFee > 0 ? `₹${t.entryFee}` : 'Free'}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Entry</p>
                        </div>
                        <div className={`text-center p-2.5 rounded-xl ${t.prizePool > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
                          <p className={`text-sm font-black ${t.prizePool > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
                            {t.prizePool > 0 ? `₹${(t.prizePool / 1000).toFixed(0)}K` : '—'}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Prize</p>
                        </div>
                        <div className="text-center p-2.5 bg-gray-50 rounded-xl">
                          <p className="text-sm font-black text-gray-900">
                            {t.teams?.length || 0}<span className="text-gray-400 font-normal text-xs">/{t.maxTeams}</span>
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Teams</p>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-gray-500 flex-1">
                        {t.startDate && (
                          <div className="flex items-center gap-1.5">
                            <FiCalendar size={11} className="text-gray-400 flex-shrink-0" />
                            <span>
                              {new Date(t.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {t.endDate && ` – ${new Date(t.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                            </span>
                          </div>
                        )}
                        {t.location?.city && (
                          <div className="flex items-center gap-1.5">
                            <FiMapPin size={11} className="text-gray-400 flex-shrink-0" />
                            <span>{t.location.city}{t.location.state ? `, ${t.location.state}` : ''}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                        {t.status === 'registration_open' && daysLeft !== null && daysLeft > 0 ? (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                            <FiClock size={11} /> {daysLeft}d left
                          </div>
                        ) : t.status === 'registration_open' && slotsLeft > 0 ? (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                            <FiUsers size={11} /> {slotsLeft} slots open
                          </div>
                        ) : (
                          <div />
                        )}
                        <span className="inline-flex items-center gap-1 text-indigo-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          View <FiChevronRight size={13} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
