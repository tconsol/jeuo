import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import api from '../lib/api';

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser } = useSelector((s) => s.auth);
  const userId = id || currentUser?._id;

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
        <div className="bg-white rounded-2xl shadow-card animate-pulse h-40" />
        <div className="bg-white rounded-2xl shadow-card animate-pulse h-32" />
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center py-12 text-gray-500">User not found</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Profile header */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-primary-500/20">
            {profile.name?.[0] || '?'}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
            <p className="text-sm text-gray-500">{profile.email || profile.phone}</p>
            <div className="flex gap-4 mt-1.5 text-xs text-gray-500">
              <span><strong className="text-gray-900">{profile.followers?.length || 0}</strong> followers</span>
              <span><strong className="text-gray-900">{profile.following?.length || 0}</strong> following</span>
            </div>
          </div>
          {!isOwn && currentUser && (
            <button onClick={async () => {
              await api.post(`/users/${userId}/follow`);
            }} className="btn-primary text-sm">Follow</button>
          )}
        </div>
      </div>

      {/* Sports & Skill levels */}
      {profile.sports?.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
          <h2 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Sports</h2>
          <div className="flex flex-wrap gap-2">
            {profile.sports.map((s) => (
              <div key={s.sport} className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <span className="text-sm capitalize text-gray-700">{s.sport}</span>
                {s.skillLevel && (
                  <span className="text-xs text-primary-600 ml-2 font-medium">{s.skillLevel}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
          <h2 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Stats</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-primary-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-primary-600">{stats.matchesPlayed || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Matches</p>
            </div>
            <div className="bg-accent-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-accent-600">{stats.wins || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Wins</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-amber-600">{stats.tournaments || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Tournaments</p>
            </div>
          </div>
        </div>
      )}

      {/* Playpals */}
      {profile.playpals?.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Playpals</h2>
          <div className="flex flex-wrap gap-2">
            {profile.playpals.slice(0, 10).map((pal) => (
              <a key={pal._id} href={`/profile/${pal._id}`}
                className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 hover:bg-gray-200 transition">
                <div className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center text-xs font-bold text-primary-600">
                  {pal.name?.[0] || '?'}
                </div>
                <span className="text-sm">{pal.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
