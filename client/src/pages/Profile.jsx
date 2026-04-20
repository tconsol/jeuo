import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SportIcon } from '../utils/sportIcons';
import { FiGrid, FiAward, FiTarget, FiUser, FiMapPin, FiCalendar, FiEdit3, FiUserPlus, FiActivity } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import api from '../lib/api';

const SKILL_STYLES = {
  beginner:     'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  intermediate: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  advanced:     'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  pro:          'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  professional: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
};

const PLAN_COLORS = {
  free:    'bg-gray-100 text-gray-600',
  pro:     'bg-indigo-100 text-indigo-700',
  premium: 'bg-amber-100 text-amber-700',
};

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

  const profile = data?.data?.user;
  const stats = statsData?.data?.stats || statsData?.data;
  const isOwn = currentUser?._id === userId;
  const plan = profile?.subscription?.plan || 'free';

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <div className="bg-white rounded-3xl animate-pulse h-56" />
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl animate-pulse h-24" />)}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-24">
        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FiUser size={36} className="text-gray-300" />
        </div>
        <h2 className="text-lg font-semibold text-gray-700">User not found</h2>
        <p className="text-sm text-gray-400 mt-1">This profile doesn't exist or has been removed</p>
        <Link to="/" className="mt-6 inline-flex btn-primary text-sm">Go Home</Link>
      </div>
    );
  }

  const handleFollow = async () => {
    setFollowing(true);
    try { await api.post(`/users/${userId}/follow`); } finally { setFollowing(false); }
  };

  const reliability = profile.reliabilityScore ?? 100;
  const joinDate = profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-4">

      {/* ═══ HERO CARD ═══ */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
        <div className="h-32 sm:h-40 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 relative">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='.06'%3E%3Ccircle cx='30' cy='30' r='8'/%3E%3C/g%3E%3C/svg%3E\")" }} />
        </div>

        <div className="px-5 sm:px-8 pb-6 -mt-12 relative">
          <div className="flex items-end justify-between mb-5">
            <div className="flex items-end gap-4">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="w-24 h-24 rounded-2xl object-cover shadow-lg ring-4 ring-white" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg ring-4 ring-white">
                  {profile.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="hidden sm:block pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                  {plan !== 'free' && (
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${PLAN_COLORS[plan]}`}>{plan}</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{profile.email || profile.phone}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {isOwn ? (
                <Link to="/profile/edit" className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition shadow-sm">
                  <FiEdit3 size={14} /> Edit Profile
                </Link>
              ) : currentUser ? (
                <button onClick={handleFollow} disabled={following}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm active:scale-[0.97]">
                  <FiUserPlus size={14} /> {following ? 'Following…' : 'Follow'}
                </button>
              ) : null}
            </div>
          </div>

          <div className="sm:hidden mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
              {plan !== 'free' && (
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${PLAN_COLORS[plan]}`}>{plan}</span>
              )}
            </div>
            <p className="text-sm text-gray-500">{profile.email || profile.phone}</p>
          </div>

          {profile.bio && <p className="text-sm text-gray-600 leading-relaxed mb-4">{profile.bio}</p>}

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-400 mb-4">
            {profile.location?.city && (
              <span className="flex items-center gap-1"><FiMapPin size={12} />{profile.location.city}{profile.location.state ? `, ${profile.location.state}` : ''}</span>
            )}
            {joinDate && <span className="flex items-center gap-1"><FiCalendar size={12} />Joined {joinDate}</span>}
            {reliability < 100 && (
              <span className="flex items-center gap-1"><FiActivity size={12} />Reliability {reliability}%</span>
            )}
          </div>

          <div className="flex gap-6 pt-3 border-t border-gray-100">
            <span className="text-sm"><strong className="text-gray-900">{profile.followers?.length || 0}</strong> <span className="text-gray-400">followers</span></span>
            <span className="text-sm"><strong className="text-gray-900">{profile.following?.length || 0}</strong> <span className="text-gray-400">following</span></span>
            {profile.playpals?.length > 0 && (
              <span className="text-sm"><strong className="text-gray-900">{profile.playpals.length}</strong> <span className="text-gray-400">playpals</span></span>
            )}
            {profile.gamesPlayed > 0 && (
              <span className="text-sm"><strong className="text-gray-900">{profile.gamesPlayed}</strong> <span className="text-gray-400">games</span></span>
            )}
          </div>
        </div>
      </div>

      {/* ═══ STATS GRID ═══ */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Matches', value: stats?.matchesPlayed || profile.gamesPlayed || 0, Icon: FiGrid, gradient: 'from-indigo-500 to-blue-500', bg: 'bg-indigo-50', color: 'text-indigo-600' },
          { label: 'Wins', value: stats?.wins || 0, Icon: FiAward, gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', color: 'text-amber-600' },
          { label: 'Tournaments', value: stats?.tournaments || 0, Icon: FiTarget, gradient: 'from-violet-500 to-purple-500', bg: 'bg-violet-50', color: 'text-violet-600' },
        ].map((s) => (
          <motion.div key={s.label} whileHover={{ y: -2 }} className={`${s.bg} rounded-2xl p-4 sm:p-5 text-center border border-white/80 shadow-sm`}>
            <div className="flex justify-center mb-2">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-sm`}>
                <s.Icon size={16} className="text-white" />
              </div>
            </div>
            <p className={`text-2xl sm:text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] font-medium text-gray-500 mt-0.5 uppercase tracking-wider">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ═══ RATING & RELIABILITY ═══ */}
      {(profile.rating > 0 || reliability < 100) && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-8">
            {profile.rating > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-xl">⭐</div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{profile.rating?.toFixed(1)}</p>
                  <p className="text-[11px] text-gray-400">{profile.totalRatings} ratings</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-xl">🛡️</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{reliability}%</p>
                <p className="text-[11px] text-gray-400">Reliability</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SPORTS ═══ */}
      {profile.sports?.length > 0 && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Sports</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profile.sports.map((s) => (
              <div key={s.sport} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 hover:border-gray-200 transition">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-100">
                  <SportIcon sport={s.sport} size={20} className="text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold capitalize text-gray-800">{s.sport?.replace('_', ' ')}</p>
                  {s.position && <p className="text-[11px] text-gray-400">{s.position}</p>}
                </div>
                {s.skillLevel && (
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${SKILL_STYLES[s.skillLevel] || SKILL_STYLES.beginner}`}>
                    {s.skillLevel}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ PLAYPALS ═══ */}
      {profile.playpals?.length > 0 && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Playpals</h2>
          <div className="flex flex-wrap gap-2">
            {profile.playpals.slice(0, 16).map((pal) => (
              <Link key={pal._id} to={`/profile/${pal._id}`}
                className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 hover:bg-indigo-50 hover:border-indigo-200 transition-colors group">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
                  {pal.name?.[0]?.toUpperCase() || '?'}
                </div>
                <span className="text-sm text-gray-700 group-hover:text-indigo-700 transition">{pal.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

