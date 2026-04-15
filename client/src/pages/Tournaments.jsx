import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiCalendar, FiUsers, FiAward, FiClock, FiMapPin, FiChevronRight } from 'react-icons/fi';
import api from '../lib/api';

const SPORTS_OPTIONS = [
  { value: 'all', label: 'All Sports', emoji: '🏆' },
  { value: 'cricket', label: 'Cricket', emoji: '🏏' },
  { value: 'football', label: 'Football', emoji: '⚽' },
  { value: 'basketball', label: 'Basketball', emoji: '🏀' },
  { value: 'tennis', label: 'Tennis', emoji: '🎾' },
  { value: 'badminton', label: 'Badminton', emoji: '🏸' },
  { value: 'volleyball', label: 'Volleyball', emoji: '🏐' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'registration_open', label: 'Open' },
  { value: 'in_progress', label: 'Live' },
  { value: 'completed', label: 'Completed' },
];

const SPORT_GRADIENTS = {
  cricket: 'from-green-500 to-emerald-600',
  football: 'from-emerald-500 to-teal-600',
  basketball: 'from-orange-500 to-amber-600',
  tennis: 'from-lime-500 to-green-600',
  badminton: 'from-blue-500 to-indigo-600',
  volleyball: 'from-yellow-500 to-orange-600',
  table_tennis: 'from-red-500 to-pink-600',
};

const STATUS_STYLES = {
  registration_open: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', label: 'Registration Open' },
  registration_closed: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Registration Closed' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500 animate-pulse', label: 'Live' },
  completed: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', label: 'Completed' },
  draft: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-300', label: 'Draft' },
};

function daysUntil(date) {
  if (!date) return null;
  const diff = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function Tournaments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sport, setSport] = useState(searchParams.get('sport') || 'all');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');

  const { data, isLoading } = useQuery({
    queryKey: ['tournaments', sport, status],
    queryFn: () => {
      const params = {};
      if (sport !== 'all') params.sport = sport;
      if (status !== 'all') params.status = status;
      return api.get('/tournaments', { params }).then((r) => r.data);
    },
  });

  const tournaments = data?.data?.tournaments || [];
  const total = data?.data?.total || 0;

  const handleFilter = (key, value) => {
    if (key === 'sport') setSport(value);
    if (key === 'status') setStatus(value);
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all') newParams.delete(key);
    else newParams.set(key, value);
    setSearchParams(newParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900">Tournaments</h1>
        <p className="text-gray-500 mt-1">Compete, win, and rise to the top</p>
      </div>

      {/* Sport filter */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
        {SPORTS_OPTIONS.map(({ value, label, emoji }) => (
          <button key={value} onClick={() => handleFilter('sport', value)}
            className={`flex items-center gap-2 flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
              sport === value
                ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/25'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
            }`}>
            <span>{emoji}</span> {label}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-8">
        {STATUS_OPTIONS.map(({ value, label }) => (
          <button key={value} onClick={() => handleFilter('status', value)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              status === value
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}>
            {label}
          </button>
        ))}
        {total > 0 && <span className="ml-auto text-sm text-gray-400 self-center">{total} tournaments</span>}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-card animate-pulse">
              <div className="h-32 bg-gray-100" />
              <div className="p-5">
                <div className="h-5 bg-gray-100 rounded-lg w-2/3 mb-3" />
                <div className="h-4 bg-gray-100 rounded-lg w-1/2 mb-4" />
                <div className="flex gap-3">
                  <div className="h-8 bg-gray-100 rounded-lg w-20" />
                  <div className="h-8 bg-gray-100 rounded-lg w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiAward size={36} className="text-gray-300" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">No tournaments found</h3>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">Check back soon or try adjusting your filters to find ongoing competitions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((t, i) => {
            const gradient = SPORT_GRADIENTS[t.sport] || 'from-primary-500 to-primary-600';
            const statusStyle = STATUS_STYLES[t.status] || STATUS_STYLES.draft;
            const daysLeft = daysUntil(t.registrationDeadline);
            const slotsLeft = t.maxTeams - (t.teams?.length || 0);
            const sportOption = SPORTS_OPTIONS.find(s => s.value === t.sport);

            return (
              <motion.div key={t._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}>
                <Link to={`/tournaments/${t._id}`}
                  className="block bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover border border-gray-100 transition-all duration-300 group">

                  {/* Gradient header */}
                  <div className={`bg-gradient-to-br ${gradient} p-5 relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 opacity-10 text-8xl font-bold leading-none -mt-4 -mr-4">{sportOption?.emoji}</div>
                    <div className="relative">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text} mb-3`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                        {statusStyle.label}
                      </div>
                      <h3 className="font-bold text-lg text-white leading-tight">{t.name}</h3>
                      <p className="text-white/70 text-sm mt-1 capitalize">{t.sport} · {t.format?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    {/* Key metrics */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {t.entryFee > 0 && (
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">₹{t.entryFee}</p>
                          <p className="text-xs text-gray-400">Entry Fee</p>
                        </div>
                      )}
                      {t.entryFee === 0 && (
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-600">Free</p>
                          <p className="text-xs text-gray-400">Entry</p>
                        </div>
                      )}
                      {t.prizePool > 0 ? (
                        <div className="text-center">
                          <p className="text-lg font-bold text-amber-600">₹{t.prizePool.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">Prize Pool</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-300">—</p>
                          <p className="text-xs text-gray-400">Prize</p>
                        </div>
                      )}
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{t.teams?.length || 0}<span className="text-gray-400 text-sm">/{t.maxTeams}</span></p>
                        <p className="text-xs text-gray-400">Teams</p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      {t.startDate && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <FiCalendar size={14} className="text-gray-400" />
                          <span>{new Date(t.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          {t.endDate && <span className="text-gray-300">–</span>}
                          {t.endDate && <span>{new Date(t.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                        </div>
                      )}
                      {t.location?.city && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <FiMapPin size={14} className="text-gray-400" />
                          <span>{t.location.city}{t.location.state ? `, ${t.location.state}` : ''}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      {t.status === 'registration_open' && daysLeft !== null && daysLeft > 0 ? (
                        <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                          <FiClock size={12} />
                          {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                        </div>
                      ) : t.status === 'registration_open' && slotsLeft > 0 ? (
                        <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                          <FiUsers size={12} />
                          {slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} left
                        </div>
                      ) : (
                        <div />
                      )}
                      <span className="inline-flex items-center gap-1 text-primary-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        View <FiChevronRight size={14} />
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
  );
}
