import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import api from '../lib/api';

const SKILL_STYLES = {
  beginner:     'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  intermediate: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
  advanced:     'bg-violet-50 text-violet-700 ring-1 ring-violet-100',
  pro:          'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
};

const SPORT_EMOJI = { cricket: '🏏', football: '⚽', basketball: '🏀', tennis: '🎾', badminton: '🏸', volleyball: '🏐', default: '🏓' };

const GRADIENT_PAIRS = [
  'from-primary-400 to-primary-600',
  'from-violet-400 to-purple-600',
  'from-emerald-400 to-teal-500',
  'from-rose-400 to-pink-600',
  'from-amber-400 to-orange-500',
];

function avatarGradient(name) {
  const idx = (name?.charCodeAt(0) || 0) % GRADIENT_PAIRS.length;
  return GRADIENT_PAIRS[idx];
}

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser } = useSelector((s) => s.auth);
  const userId = id || currentUser?._id;
  const [following, setFollowing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => api.get(`/users/${userId}`).then((r) => r.data),
    enabled: !!userId,
  });

  const { data: statsData } = useQuery({
    queryKey: ['user-stats', userId],
    queryFn: () => api.get(`/users/${userId}/stats`).then((r) => r.data),
    enabled: !!userId,
  });

  const profile = data?.user;
  const stats = statsData?.stats;
  const isOwn = currentUser?._id === userId;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="bg-white rounded-2xl shadow-card animate-pulse h-48" />
        <div className="bg-white rounded-2xl shadow-card animate-pulse h-32" />
        <div className="bg-white rounded-2xl shadow-card animate-pulse h-28" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 text-gray-500">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">👤</div>
        User not found
      </div>
    );
  }

  const handleFollow = async () => {
    setFollowing(true);
    try {
      await api.post(`/users/${userId}/follow`);
    } finally {
      setFollowing(false);
    }
  };

  const grad = avatarGradient(profile.name);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      {/* Profile Header card */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-gray-100">
        {/* Cover banner */}
        <div className={`h-24 bg-gradient-to-br ${grad} relative`}>
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 right-4 text-4xl">🏟️</div>
          </div>
        </div>

        <div className="px-6 pb-6">
          {/* Avatar + actions */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-2xl font-bold text-white shadow-lg ring-4 ring-white`}>
              {profile.name?.[0]?.toUpperCase() || '?'}
            </div>
            {!isOwn && currentUser && (
              <button
                onClick={handleFollow}
                disabled={following}
                className="btn-primary text-sm !px-5 !py-2 disabled:opacity-50"
              >
                {following ? 'Following…' : 'Follow'}
              </button>
            )}
            {isOwn && (
              <Link to="/profile/edit" className="btn-secondary text-sm !px-5 !py-2">Edit Profile</Link>
            )}
          </div>

          <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
          <p className="text-sm text-gray-500">{profile.email || profile.phone}</p>

          {/* Follower stats */}
          <div className="flex gap-5 mt-3">
            <span className="text-sm"><strong className="text-gray-900">{profile.followers?.length || 0}</strong> <span className="text-gray-500">followers</span></span>
            <span className="text-sm"><strong className="text-gray-900">{profile.following?.length || 0}</strong> <span className="text-gray-500">following</span></span>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Matches', value: stats.matchesPlayed || 0, color: 'text-primary-600', bg: 'bg-primary-50', emoji: '🏟️' },
            { label: 'Wins', value: stats.wins || 0, color: 'text-amber-600', bg: 'bg-amber-50', emoji: '🏆' },
            { label: 'Tournaments', value: stats.tournaments || 0, color: 'text-violet-600', bg: 'bg-violet-50', emoji: '🎯' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center border border-white`}>
              <p className="text-2xl mb-1">{s.emoji}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sports */}
      {profile.sports?.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Sports</h2>
          <div className="flex flex-wrap gap-2">
            {profile.sports.map((s) => (
              <div key={s.sport} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                <span>{SPORT_EMOJI[s.sport] || SPORT_EMOJI.default}</span>
                <span className="text-sm font-medium capitalize text-gray-700">{s.sport}</span>
                {s.skillLevel && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SKILL_STYLES[s.skillLevel] || SKILL_STYLES.beginner}`}>
                    {s.skillLevel}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Playpals */}
      {profile.playpals?.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Playpals</h2>
          <div className="flex flex-wrap gap-2">
            {profile.playpals.slice(0, 12).map((pal) => (
              <Link
                key={pal._id}
                to={`/profile/${pal._id}`}
                className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 hover:bg-gray-100 hover:border-gray-200 transition-colors"
              >
                <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${avatarGradient(pal.name)} flex items-center justify-center text-xs font-bold text-white`}>
                  {pal.name?.[0]?.toUpperCase() || '?'}
                </div>
                <span className="text-sm text-gray-700">{pal.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

