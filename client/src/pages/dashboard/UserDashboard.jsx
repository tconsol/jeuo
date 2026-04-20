import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { SportIcon } from '../../utils/sportIcons';
import { useSelector } from 'react-redux';
import { userService } from '../../services';

const STAT_CONFIG = [
  {
    key: 'matchesPlayed',
    label: 'Matches Played',
    gradient: 'from-indigo-500 to-primary-600',
    bg: 'bg-primary-50',
    text: 'text-primary-600',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'wins',
    label: 'Wins',
    gradient: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    key: 'activitiesJoined',
    label: 'Games Joined',
    gradient: 'from-emerald-400 to-teal-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: 'bookings',
    label: 'Bookings',
    gradient: 'from-violet-400 to-purple-600',
    bg: 'bg-violet-50',
    text: 'text-violet-600',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

// sport icons via SportIcon component

const QUICK_LINKS = [
  { to: '/venues', label: 'Book a Venue', desc: 'Find and reserve courts', color: 'bg-primary-50 text-primary-600', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  )},
  { to: '/activities', label: 'Find a Game', desc: 'Join open activities', color: 'bg-emerald-50 text-emerald-600', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  )},
  { to: '/tournaments', label: 'Tournaments', desc: 'Compete & win prizes', color: 'bg-amber-50 text-amber-600', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138A3.42 3.42 0 0020.5 12a3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138A3.42 3.42 0 0014.61 18.9a3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138A3.42 3.42 0 003.5 12a3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138A3.42 3.42 0 008.39 4.697z" /></svg>
  )},
  { to: '/bookings', label: 'My Bookings', desc: 'View & manage bookings', color: 'bg-violet-50 text-violet-600', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
  )},
];

export default function UserDashboard() {
  const { user } = useSelector((s) => s.auth);
  const { data: stats, isLoading } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => userService.getStats().then((r) => r.data.data),
  });

  const winRate = stats?.matchesPlayed > 0 ? Math.round((stats.wins / stats.matchesPlayed) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Welcome header */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full" />
        <div className="relative z-10">
          <p className="text-primary-200 text-sm font-medium">Welcome back,</p>
          <h1 className="text-2xl font-bold mt-0.5">{user?.name?.split(' ')[0] || 'Player'} </h1>
          {stats && (
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5 text-sm">
                <span className="font-semibold">{winRate}%</span>
                <span className="text-primary-200">win rate</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5 text-sm">
                <span className="font-semibold">{stats.matchesPlayed || 0}</span>
                <span className="text-primary-200">matches</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse shadow-card" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {STAT_CONFIG.map((cfg) => (
            <div key={cfg.key} className="bg-white rounded-2xl p-4 shadow-card border border-gray-100">
              <div className={`w-10 h-10 rounded-xl ${cfg.bg} ${cfg.text} flex items-center justify-center mb-3`}>
                {cfg.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats?.[cfg.key] || 0}</p>
              <p className="text-xs text-gray-500 mt-0.5">{cfg.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_LINKS.map((ql) => (
            <Link key={ql.to} to={ql.to} className="bg-white rounded-2xl p-4 shadow-card border border-gray-100 hover:shadow-card-hover transition-all duration-200 group">
              <div className={`w-10 h-10 rounded-xl ${ql.color} flex items-center justify-center mb-3`}>
                {ql.icon}
              </div>
              <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{ql.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{ql.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Sport breakdown */}
      {stats?.sportBreakdown && Object.keys(stats.sportBreakdown).length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Sport Breakdown</h2>
          <div className="space-y-3">
            {Object.entries(stats.sportBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([sport, count]) => {
                const max = Math.max(...Object.values(stats.sportBreakdown));
                const pct = Math.round((count / max) * 100);
                return (
                  <div key={sport}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm flex items-center gap-2">
                        <span>{SPORT_ICONS[sport] || SPORT_ICONS.default}</span>
                        <span className="capitalize text-gray-700">{sport}</span>
                      </span>
                      <span className="text-sm font-medium text-gray-500">{count} matches</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

