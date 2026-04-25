import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import api from '../lib/api';
import { FiArrowLeft, FiCalendar, FiClock, FiMapPin, FiUsers, FiCheck } from 'react-icons/fi';
import { SportIcon } from '../utils/sportIcons';
import { motion } from 'framer-motion';

const SPORT_GRADIENT = {
  cricket:      'from-emerald-600 to-teal-700',
  football:     'from-green-600 to-emerald-700',
  basketball:   'from-orange-500 to-amber-600',
  tennis:       'from-lime-500 to-green-600',
  badminton:    'from-blue-600 to-indigo-700',
  volleyball:   'from-yellow-500 to-amber-600',
  table_tennis: 'from-red-500 to-rose-600',
};

const STATUS_CONFIG = {
  upcoming:    { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  open:        { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  in_progress: { bg: 'bg-blue-50',   text: 'text-blue-700',    dot: 'bg-blue-500'    },
  full:        { bg: 'bg-amber-50',  text: 'text-amber-700',   dot: 'bg-amber-500'   },
  completed:   { bg: 'bg-gray-100',  text: 'text-gray-500',    dot: 'bg-gray-400'    },
  cancelled:   { bg: 'bg-red-50',    text: 'text-red-600',     dot: 'bg-red-500'     },
};

export default function ActivityDetail() {
  const { id } = useParams();
  const user = useSelector((s) => s.auth.user);
  const queryClient = useQueryClient();

  const { data: activity, isLoading } = useQuery({
    queryKey: ['activity', id],
    queryFn: () => api.get(`/activities/${id}`).then((r) => r.data.data.activity),
  });

  const joinMutation = useMutation({
    mutationFn: () => api.post(`/activities/${id}/join`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activity', id] }),
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4 animate-pulse">
        <div className="h-8 w-24 bg-gray-100 rounded-xl" />
        <div className="h-48 bg-gray-100 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 h-32 bg-gray-100 rounded-2xl" />
          <div className="h-32 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="text-center py-24 text-gray-400">
        <p className="text-sm font-semibold">Activity not found</p>
      </div>
    );
  }

  const joinedPlayers = activity.players?.filter((p) => ['approved', 'confirmed'].includes(p.status)) || [];
  const statusCfg = STATUS_CONFIG[activity.status] || STATUS_CONFIG.upcoming;
  const spotsLeft = (activity.maxPlayers || 0) - joinedPlayers.length;
  const isPending = activity.players?.some((p) => p.user?._id === user?._id && p.status === 'pending');
  const isJoined = joinedPlayers.some((p) => p.user?._id === user?._id);
  const canJoin = ['upcoming', 'open', 'in_progress'].includes(activity.status) && spotsLeft > 0 && !isJoined && !isPending;
  const gradient = SPORT_GRADIENT[activity.sport] || SPORT_GRADIENT.cricket;
  const fillPct = activity.maxPlayers ? (joinedPlayers.length / activity.maxPlayers) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 pb-24">
      <Link to="/activities"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition font-medium">
        <FiArrowLeft size={15} /> Back to games
      </Link>

      {/* Hero */}
      <div className={`bg-gradient-to-br ${gradient} rounded-3xl p-6 mb-5 overflow-hidden relative shadow-xl`}>
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full" />
        <div className="absolute bottom-0 left-1/3 w-36 h-36 bg-black/10 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center flex-shrink-0">
                <SportIcon sport={activity.sport} size={30} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white leading-tight">{activity.title}</h1>
                <p className="text-white/60 text-xs mt-0.5 capitalize">{activity.sport?.replace(/_/g, ' ')}</p>
              </div>
            </div>
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0 ${statusCfg.bg} ${statusCfg.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {activity.status?.charAt(0).toUpperCase() + activity.status?.slice(1)}
            </span>
          </div>

          <div className="flex flex-wrap gap-4">
            {activity.date && (
              <span className="flex items-center gap-1.5 text-white/80 text-xs">
                <FiCalendar size={12} />
                {new Date(activity.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
            {activity.time && (
              <span className="flex items-center gap-1.5 text-white/80 text-xs">
                <FiClock size={12} /> {activity.time}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-white/80 text-xs">
              <FiUsers size={12} /> {joinedPlayers.length}/{activity.maxPlayers} players
            </span>
            {activity.costPerPlayer > 0 && (
              <span className="text-white font-bold text-xs bg-white/20 px-2 py-0.5 rounded-full">
                ₹{activity.costPerPlayer}/player
              </span>
            )}
            {activity.costPerPlayer === 0 && (
              <span className="text-white font-bold text-xs bg-white/20 px-2 py-0.5 rounded-full">Free</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main */}
        <div className="md:col-span-2 space-y-4">

          {activity.description && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">About this game</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{activity.description}</p>
            </div>
          )}

          {activity.venue && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Venue</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FiMapPin size={17} className="text-indigo-500" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{activity.venue.name}</p>
                  {(activity.venue.address?.area || activity.venue.address?.city) && (
                    <p className="text-xs text-gray-400">
                      {[activity.venue.address.area, activity.venue.address.city].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Players */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Players</h2>
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
                {joinedPlayers.length}/{activity.maxPlayers}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${fillPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft > 1 ? 's' : ''} remaining` : 'Game is full'}
              </p>
            </div>

            {joinedPlayers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No players yet — be the first to join!</p>
            ) : (
              <div className="space-y-2.5">
                {joinedPlayers.map((p) => (
                  <div key={p.user._id} className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-sm font-black text-white flex-shrink-0`}>
                      {p.user.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{p.user.name}</p>
                      {p.user.skillLevel && (
                        <p className="text-[10px] text-gray-400 capitalize">{p.user.skillLevel}</p>
                      )}
                    </div>
                    {p.user._id === activity.organiser?._id && (
                      <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold uppercase">
                        Organiser
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm sticky top-20">
            <div className="text-center mb-5">
              <p className="text-3xl font-black text-gray-900">
                {activity.costPerPlayer > 0 ? `₹${activity.costPerPlayer}` : 'Free'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">per player</p>
            </div>

            {isJoined ? (
              <div className="w-full py-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-bold text-center flex items-center justify-center gap-2">
                <FiCheck size={14} /> You've joined
              </div>
            ) : isPending ? (
              <div className="w-full py-3 rounded-xl bg-amber-50 text-amber-700 text-sm font-bold text-center flex items-center justify-center gap-2">
                <FiClock size={14} /> Request Pending
              </div>
            ) : canJoin ? (
              <button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending}
                className={`w-full py-3 rounded-xl bg-gradient-to-r ${gradient} text-white text-sm font-black transition active:scale-95 disabled:opacity-60 shadow-lg`}>
                {joinMutation.isPending ? 'Joining…' : 'Join Game'}
              </button>
            ) : (
              <div className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 text-sm font-bold text-center cursor-not-allowed">
                {spotsLeft <= 0 ? 'Game Full' : activity.status === 'completed' ? 'Completed' : activity.status === 'cancelled' ? 'Cancelled' : 'Not Available'}
              </div>
            )}

            <div className="mt-4 space-y-2.5 border-t border-gray-50 pt-4">
              {activity.skillLevel && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Skill level</span>
                  <span className="font-semibold text-gray-700 capitalize">{activity.skillLevel}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Spots left</span>
                <span className={`font-bold ${spotsLeft > 0 ? 'text-gray-900' : 'text-red-500'}`}>
                  {spotsLeft > 0 ? spotsLeft : 'Full'}
                </span>
              </div>
              {activity.organiser?.name && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Organiser</span>
                  <span className="font-semibold text-gray-700">{activity.organiser.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
