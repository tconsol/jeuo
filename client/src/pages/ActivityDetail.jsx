import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import api from '../lib/api';
import { FiArrowLeft, FiCalendar, FiClock, FiMapPin, FiUsers, FiDollarSign } from 'react-icons/fi';

const SPORT_EMOJI = {
  cricket: 'ðŸ', football: 'âš½', basketball: 'ðŸ€', badminton: 'ðŸ¸',
  tennis: 'ðŸŽ¾', volleyball: 'ðŸ', table_tennis: 'ðŸ“', swimming: 'ðŸŠ',
};

const STATUS_STYLES = {
  upcoming:    { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-100', dot: 'bg-emerald-500' },
  open:        { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-100', dot: 'bg-emerald-500' },
  in_progress: { bg: 'bg-blue-50',    text: 'text-blue-700',    ring: 'ring-blue-100',    dot: 'bg-blue-500'   },
  full:        { bg: 'bg-amber-50',   text: 'text-amber-700',   ring: 'ring-amber-100',   dot: 'bg-amber-500'  },
  completed:   { bg: 'bg-gray-100',   text: 'text-gray-500',    ring: 'ring-gray-200',    dot: 'bg-gray-400'   },
  cancelled:   { bg: 'bg-red-50',     text: 'text-red-600',     ring: 'ring-red-100',     dot: 'bg-red-500'    },
};

export default function ActivityDetail() {
  const { id } = useParams();
  const user = useSelector((s) => s.auth.user);
  const queryClient = useQueryClient();

  const { data: activity, isLoading } = useQuery({
    queryKey: ['activity', id],
    queryFn: async () => {
      const { data } = await api.get(`/activities/${id}`);
      return data.data.activity;
    },
  });

  const joinMutation = useMutation({
    mutationFn: () => api.post(`/activities/${id}/join`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activity', id] }),
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-40 bg-gray-100 rounded-2xl" />
        <div className="h-6 bg-gray-100 rounded-lg w-1/2" />
        <div className="h-4 bg-gray-100 rounded-lg w-1/3" />
      </div>
    );
  }

  if (!activity) return <div className="text-center py-20 text-gray-500">Activity not found</div>;

  const joinedPlayers = activity.players?.filter(p => ['approved', 'confirmed'].includes(p.status)) || [];
  const emoji = SPORT_EMOJI[activity.sport?.toLowerCase()] || 'ðŸ…';
  const statusStyle = STATUS_STYLES[activity.status] || STATUS_STYLES.upcoming;
  const spotsLeft = (activity.maxPlayers || 0) - joinedPlayers.length;
  const isPending = activity.players?.some(p => p.user?._id === user?._id && p.status === 'pending');
  const isJoined = joinedPlayers.some(p => p.user?._id === user?._id);
  const canJoin = ['upcoming', 'open', 'in_progress'].includes(activity.status) && spotsLeft > 0 && !isJoined && !isPending;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/activities" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors">
        <FiArrowLeft size={16} /> Back to games
      </Link>

      {/* Hero header */}
      <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-700 rounded-2xl p-6 mb-6 overflow-hidden">
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-3xl flex-shrink-0">
                {emoji}
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-white leading-tight">{activity.title}</h1>
                <p className="text-primary-200 text-sm mt-1 capitalize">{activity.sport?.replace(/_/g, ' ')}</p>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ring-1 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.ring} flex-shrink-0`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
              {activity.status?.charAt(0).toUpperCase() + activity.status?.slice(1)}
            </div>
          </div>

          {/* Quick stats row */}
          <div className="flex flex-wrap gap-4 mt-5">
            {activity.date && (
              <div className="flex items-center gap-1.5 text-primary-100 text-sm">
                <FiCalendar size={14} />
                {new Date(activity.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            )}
            {activity.time && (
              <div className="flex items-center gap-1.5 text-primary-100 text-sm">
                <FiClock size={14} />
                {activity.time}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-primary-100 text-sm">
              <FiUsers size={14} />
              {joinedPlayers.length}/{activity.maxPlayers} players
            </div>
            {activity.costPerPlayer > 0 && (
              <div className="flex items-center gap-1.5 text-primary-100 text-sm">
                <FiDollarSign size={14} />
                â‚¹{activity.costPerPlayer}/player
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main content */}
        <div className="md:col-span-2 space-y-4">
          {activity.description && (
            <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-2">About this game</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{activity.description}</p>
            </div>
          )}

          {activity.venue && (
            <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-3">Venue</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <FiMapPin size={18} className="text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{activity.venue.name}</p>
                  {activity.venue.address && (
                    <p className="text-gray-500 text-sm">
                      {[activity.venue.address.area, activity.venue.address.city].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Players list */}
          <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Players</h2>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
                {joinedPlayers.length}/{activity.maxPlayers} joined
              </span>
            </div>

            {/* Spots bar */}
            <div className="mb-4">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full transition-all"
                  style={{ width: `${activity.maxPlayers ? (joinedPlayers.length / activity.maxPlayers) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft > 1 ? 's' : ''} remaining` : 'Game is full'}
              </p>
            </div>

            {joinedPlayers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No players yet â€” be the first to join!</p>
            ) : (
              <div className="space-y-3">
                {joinedPlayers.map((p) => (
                  <div key={p.user._id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
                      {p.user.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{p.user.name}</p>
                      {p.user.skillLevel && (
                        <p className="text-xs text-gray-400 capitalize">{p.user.skillLevel}</p>
                      )}
                    </div>
                    {p.user._id === activity.organiser?._id && (
                      <span className="text-xs bg-primary-50 text-primary-600 ring-1 ring-primary-100 px-2 py-0.5 rounded-lg font-medium">
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
        <div className="space-y-4">
          {/* Join card */}
          <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100 sticky top-4">
            <div className="text-center mb-4">
              <p className="text-3xl font-bold text-gray-900">
                {activity.costPerPlayer > 0 ? `â‚¹${activity.costPerPlayer}` : 'Free'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">per player</p>
            </div>

            {isJoined ? (
              <div className="w-full py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold text-center ring-1 ring-emerald-100">
                âœ“ You've joined
              </div>
            ) : isPending ? (
              <div className="w-full py-2.5 rounded-xl bg-amber-50 text-amber-600 text-sm font-semibold text-center ring-1 ring-amber-100">
                â³ Request Pending
              </div>
            ) : canJoin ? (
              <button
                onClick={() => joinMutation.mutate()}
                disabled={joinMutation.isPending}
                className="w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {joinMutation.isPending ? 'Joiningâ€¦' : 'Join Game'}
              </button>
            ) : (
              <div className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-400 text-sm font-semibold text-center cursor-not-allowed">
                {spotsLeft <= 0 ? 'Game Full' : activity.status === 'completed' ? 'Completed' : activity.status === 'cancelled' ? 'Cancelled' : 'Not Available'}
              </div>
            )}

            <div className="mt-4 space-y-2 text-sm text-gray-600">
              {activity.skillLevel && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Skill level</span>
                  <span className="font-medium capitalize">{activity.skillLevel}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Spots left</span>
                <span className="font-medium">{spotsLeft > 0 ? spotsLeft : 'Full'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
