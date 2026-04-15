import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { FiUsers, FiCalendar, FiMapPin, FiPlus } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function Activities() {
  const { data, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const { data } = await api.get('/activities');
      return data.data;
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Find a Game</h1>
          <p className="text-gray-500 mt-1">Join activities near you</p>
        </div>
        <Link to="/activities/create" className="btn-primary flex items-center gap-2">
          <FiPlus size={18} /> Create Game
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-card animate-pulse flex gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-xl" />
              <div className="flex-1">
                <div className="h-5 bg-gray-100 rounded-lg w-1/3 mb-3" />
                <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {data?.activities?.map((activity, i) => (
            <motion.div
              key={activity._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/activities/${activity._id}`} className="flex gap-4 bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover border border-gray-100 transition-all duration-300 group">
                <div className="w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {activity.sport === 'cricket' ? '🏏' :
                   activity.sport === 'football' ? '⚽' :
                   activity.sport === 'basketball' ? '🏀' :
                   activity.sport === 'tennis' ? '🎾' :
                   activity.sport === 'badminton' ? '🏸' :
                   activity.sport === 'volleyball' ? '🏐' : '🏓'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{activity.title}</h3>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <FiCalendar size={14} />
                      {new Date(activity.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {' '}{activity.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiUsers size={14} />
                      {activity.currentPlayers}/{activity.maxPlayers}
                    </span>
                    {activity.venue && (
                      <span className="flex items-center gap-1">
                        <FiMapPin size={14} />
                        {activity.venue.name}
                      </span>
                    )}
                  </div>
                  {activity.costPerPlayer > 0 && (
                    <span className="text-sm text-primary-600 font-medium mt-1 inline-block">₹{activity.costPerPlayer}/player</span>
                  )}
                </div>
                <div className="flex items-center">
                  <span className={`badge ${
                    activity.currentPlayers >= activity.maxPlayers ? 'bg-red-50 text-red-600 ring-1 ring-red-100' : 'bg-accent-50 text-accent-600 ring-1 ring-accent-100'
                  }`}>
                    {activity.currentPlayers >= activity.maxPlayers ? 'Full' : 'Open'}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && data?.activities?.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiUsers size={28} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">No games found</h3>
          <p className="text-gray-500 mt-2">Be the first to create a game!</p>
        </div>
      )}
    </div>
  );
}
