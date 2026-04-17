import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { FiUsers, FiCalendar, FiMapPin, FiPlus, FiDollarSign } from 'react-icons/fi';
import { motion } from 'framer-motion';

const SPORTS = [
  { id: 'all', label: 'All', emoji: '🏅' },
  { id: 'cricket', label: 'Cricket', emoji: '🏏' },
  { id: 'football', label: 'Football', emoji: '⚽' },
  { id: 'basketball', label: 'Basketball', emoji: '🏀' },
  { id: 'tennis', label: 'Tennis', emoji: '🎾' },
  { id: 'badminton', label: 'Badminton', emoji: '🏸' },
  { id: 'volleyball', label: 'Volleyball', emoji: '🏐' },
];

const SPORT_EMOJI = { cricket: '🏏', football: '⚽', basketball: '🏀', tennis: '🎾', badminton: '🏸', volleyball: '🏐', default: '🏓' };

export default function Activities() {
  const [sport, setSport] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const { data } = await api.get('/activities');
      return data.data;
    },
  });

  const activities = (data?.activities || []).filter((a) => sport === 'all' || a.sport === sport);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Find a Game</h1>
          <p className="text-gray-500 mt-1">Join open activities near you</p>
        </div>
        <Link to="/activities/create" className="btn-primary flex items-center gap-2">
          <FiPlus size={18} /> Create Game
        </Link>
      </div>

      {/* Sport filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
        {SPORTS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSport(s.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              sport === s.id
                ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/25'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
            }`}
          >
            <span>{s.emoji}</span> {s.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-card animate-pulse flex gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-100 rounded-lg w-2/3" />
                <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activities.map((activity, i) => {
            const isFull = activity.currentPlayers >= activity.maxPlayers;
            return (
              <motion.div
                key={activity._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link to={`/activities/${activity._id}`} className="flex gap-4 bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover border border-gray-100 transition-all duration-300 group">
                  {/* Sport icon */}
                  <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ring-1 ring-primary-100">
                    {SPORT_EMOJI[activity.sport] || SPORT_EMOJI.default}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">{activity.title}</h3>
                      <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        isFull ? 'bg-red-50 text-red-600 ring-1 ring-red-100' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                      }`}>
                        {isFull ? 'Full' : 'Open'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <FiCalendar size={12} />
                        {new Date(activity.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        {activity.time && ` · ${activity.time}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiUsers size={12} />
                        {activity.currentPlayers}/{activity.maxPlayers} players
                      </span>
                      {activity.venue && (
                        <span className="flex items-center gap-1">
                          <FiMapPin size={12} />
                          {activity.venue.name}
                        </span>
                      )}
                    </div>

                    {activity.costPerPlayer > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-primary-600 font-medium">
                        <FiDollarSign size={11} />
                        ₹{activity.costPerPlayer}/player
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {!isLoading && activities.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiUsers size={28} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">No games found</h3>
          <p className="text-gray-500 mt-2">Be the first to create a game!</p>
          <Link to="/activities/create" className="btn-primary inline-flex items-center gap-2 mt-4 text-sm">
            <FiPlus size={16} /> Create Game
          </Link>
        </div>
      )}
    </div>
  );
}

