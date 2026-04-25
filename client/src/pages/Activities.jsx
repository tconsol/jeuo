import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { SportIcon } from '../utils/sportIcons';
import api from '../lib/api';
import { FiUsers, FiCalendar, FiMapPin, FiPlus, FiSearch, FiDollarSign } from 'react-icons/fi';
import { motion } from 'framer-motion';

const SPORTS = [
  { id: 'all', label: 'All' },
  { id: 'cricket', label: 'Cricket' },
  { id: 'football', label: 'Football' },
  { id: 'basketball', label: 'Basketball' },
  { id: 'tennis', label: 'Tennis' },
  { id: 'badminton', label: 'Badminton' },
  { id: 'volleyball', label: 'Volleyball' },
];

const SPORT_GRADIENT = {
  cricket:      'from-emerald-500 to-teal-600',
  football:     'from-green-500 to-emerald-600',
  basketball:   'from-orange-500 to-amber-600',
  tennis:       'from-lime-500 to-green-600',
  badminton:    'from-blue-500 to-indigo-600',
  volleyball:   'from-yellow-500 to-amber-600',
  table_tennis: 'from-red-500 to-rose-600',
};

export default function Activities() {
  const [sport, setSport] = useState('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => api.get('/activities').then((r) => r.data.data?.activities || []),
  });

  const activities = (data || []).filter((a) => {
    const matchesSport = sport === 'all' || a.sport === sport;
    const matchesSearch = !search || a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.venue?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesSport && matchesSearch;
  });

  const openCount = activities.filter((a) => ['upcoming', 'open'].includes(a.status)).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 pb-24">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Find a Game</h1>
          <p className="text-gray-400 text-xs mt-0.5">{openCount} open game{openCount !== 1 ? 's' : ''} near you</p>
        </div>
        <Link to="/activities/create"
          className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition active:scale-95">
          <FiPlus size={14} /> Create
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search games or venues…"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        />
      </div>

      {/* Sport filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide">
        {SPORTS.map((s) => (
          <button key={s.id} onClick={() => setSport(s.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              sport === s.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
            }`}>
            {s.id !== 'all' && <SportIcon sport={s.id} size={12} className={sport === s.id ? 'text-white' : 'text-gray-400'} />}
            {s.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {/* Empty */}
      {!isLoading && activities.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <FiUsers size={28} className="text-gray-200" />
          </div>
          <p className="text-sm font-bold text-gray-600">No games found</p>
          <p className="text-gray-400 text-xs mt-1 mb-5">
            {search ? `No results for "${search}"` : 'Be the first to create a game!'}
          </p>
          <Link to="/activities/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition">
            <FiPlus size={14} /> Create Game
          </Link>
        </div>
      )}

      {/* Grid */}
      {!isLoading && activities.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activities.map((a, i) => {
            const isFull = a.currentPlayers >= a.maxPlayers;
            const gradient = SPORT_GRADIENT[a.sport] || SPORT_GRADIENT.cricket;
            const statusOpen = ['upcoming', 'open'].includes(a.status);
            return (
              <motion.div key={a._id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}>
                <Link to={`/activities/${a._id}`}
                  className="flex gap-0 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md overflow-hidden transition-all group active:scale-[0.99]">

                  {/* Sport accent */}
                  <div className={`w-1.5 bg-gradient-to-b ${gradient} flex-shrink-0`} />

                  <div className="flex gap-3 p-4 flex-1 min-w-0">
                    {/* Icon */}
                    <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <SportIcon sport={a.sport} size={22} className="text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-bold text-gray-900 text-sm truncate group-hover:text-indigo-600 transition-colors">{a.title}</h3>
                        <span className={`flex-shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isFull
                            ? 'bg-red-50 text-red-600'
                            : statusOpen
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {isFull ? 'Full' : statusOpen ? 'Open' : a.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-400">
                        {a.date && (
                          <span className="flex items-center gap-0.5">
                            <FiCalendar size={9} />
                            {new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            {a.time && ` · ${a.time}`}
                          </span>
                        )}
                        <span className="flex items-center gap-0.5">
                          <FiUsers size={9} />
                          {a.currentPlayers}/{a.maxPlayers}
                        </span>
                        {a.venue && (
                          <span className="flex items-center gap-0.5 truncate max-w-[100px]">
                            <FiMapPin size={9} /> {a.venue.name}
                          </span>
                        )}
                        {a.costPerPlayer > 0 && (
                          <span className="flex items-center gap-0.5 text-indigo-500 font-bold">
                            <FiDollarSign size={9} /> ₹{a.costPerPlayer}
                          </span>
                        )}
                      </div>
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
