import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { tournamentService } from '../../services';
import { FixturesBracket, PointsTable } from '../../components/tournament';
import { LoadingSpinner } from '../../components/common';
import { useState } from 'react';

const SPORT_ICONS = {
  cricket: '🏏', football: '⚽', basketball: '🏀', badminton: '🏸',
  tennis: '🎾', volleyball: '🏐', table_tennis: '🏓', swimming: '🏊',
};

const STATUS_STYLES = {
  upcoming:    { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200', label: 'Upcoming' },
  registration:{ bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', label: 'Registration Open' },
  in_progress: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', label: 'In Progress' },
  completed:   { bg: 'bg-gray-100', text: 'text-gray-500', ring: 'ring-gray-200', label: 'Completed' },
  cancelled:   { bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-200', label: 'Cancelled' },
};

const FORMAT_LABELS = {
  knockout: 'Knockout',
  league: 'League / Round Robin',
  group_knockout: 'Group Stage + Knockout',
};

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TournamentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('overview');

  const { data: tournament, isLoading, error } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentService.getById(id).then((r) => r.data.data),
  });

  const { data: fixtures } = useQuery({
    queryKey: ['tournament-fixtures', id],
    queryFn: () => tournamentService.getFixtures(id).then((r) => r.data.data),
    enabled: tab === 'fixtures',
  });

  const { data: standings } = useQuery({
    queryKey: ['tournament-standings', id],
    queryFn: () => tournamentService.getStandings(id).then((r) => r.data.data),
    enabled: tab === 'standings',
  });

  const registerMutation = useMutation({
    mutationFn: () => tournamentService.register(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tournament', id] }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading tournament…</p>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-3xl">⚠️</div>
        <p className="text-red-600 font-medium">{error?.response?.data?.message || 'Tournament not found'}</p>
        <button onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm font-medium">← Go Back</button>
      </div>
    );
  }

  const icon = SPORT_ICONS[tournament.sport?.toLowerCase()] || '🏆';
  const status = STATUS_STYLES[tournament.status] || STATUS_STYLES.upcoming;
  const teams = tournament.teams || tournament.participants || [];
  const isRegistered = teams.some(t =>
    t._id === user?._id || t.user === user?._id || t.user?._id === user?._id ||
    t.players?.some(p => p._id === user?._id || p.user === user?._id)
  );
  const isOrganizer = tournament.organizer?._id === user?._id || tournament.createdBy?._id === user?._id;
  const maxTeams = tournament.maxTeams || tournament.maxParticipants || 0;
  const spotsLeft = maxTeams - teams.length;

  const TABS = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'fixtures', label: 'Fixtures', icon: '🏟️' },
    { id: 'standings', label: 'Standings', icon: '📊' },
    { id: 'teams', label: 'Teams', icon: '👥' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      className="max-w-2xl mx-auto pt-4 pb-28 space-y-4 px-4">

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />

        <div className="flex items-center justify-between mb-3 relative z-10">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-sm">← Back</button>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${status.bg} ${status.text}`}>
            {status.label}
          </span>
        </div>

        <div className="relative z-10 text-center py-3">
          <div className="text-5xl mb-3">{icon}</div>
          <h1 className="text-2xl font-black">{tournament.name}</h1>
          {tournament.description && (
            <p className="text-white/70 text-sm mt-2 max-w-md mx-auto">{tournament.description}</p>
          )}
        </div>

        {/* Quick Stats Row */}
        <div className="flex justify-center gap-6 mt-4 relative z-10">
          {formatDate(tournament.startDate) && (
            <div className="text-center">
              <p className="text-white/50 text-xs">Start</p>
              <p className="text-sm font-semibold">{formatDate(tournament.startDate)}</p>
            </div>
          )}
          {formatDate(tournament.endDate) && (
            <div className="text-center">
              <p className="text-white/50 text-xs">End</p>
              <p className="text-sm font-semibold">{formatDate(tournament.endDate)}</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-white/50 text-xs">Teams</p>
            <p className="text-sm font-semibold">{teams.length}{maxTeams ? `/${maxTeams}` : ''}</p>
          </div>
        </div>
      </div>

      {/* Registration Card */}
      {['upcoming', 'registration'].includes(tournament.status) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">Registration</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {spotsLeft > 0 ? `${spotsLeft} spots remaining` : maxTeams ? 'Registration full' : 'Open for registration'}
              </p>
            </div>
            {isRegistered ? (
              <span className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold ring-1 ring-emerald-100">
                ✓ Registered
              </span>
            ) : spotsLeft > 0 || !maxTeams ? (
              <button
                onClick={() => registerMutation.mutate()}
                disabled={registerMutation.isPending}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition active:scale-95 disabled:opacity-60"
              >
                {registerMutation.isPending ? 'Registering…' : 'Register'}
              </button>
            ) : (
              <span className="px-4 py-2 rounded-xl bg-gray-100 text-gray-400 text-sm font-semibold">Full</span>
            )}
          </div>
          {tournament.entryFee > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 bg-amber-50 rounded-xl px-4 py-2 border border-amber-100">
              <span>💰</span> Entry fee: <span className="font-bold text-amber-700">₹{tournament.entryFee}</span>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-xs font-semibold transition-all ${
              tab === t.id ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}>
            <span className="mr-1">{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {tab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Tournament Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
              <h3 className="text-sm font-bold text-gray-800">Tournament Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">Sport</p>
                  <p className="font-semibold text-gray-800 capitalize mt-0.5">{icon} {tournament.sport?.replace('_', ' ')}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">Format</p>
                  <p className="font-semibold text-gray-800 mt-0.5">{FORMAT_LABELS[tournament.format] || tournament.format || 'Knockout'}</p>
                </div>
                {tournament.venue?.name && (
                  <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                    <p className="text-gray-400 text-xs">Venue</p>
                    <p className="font-semibold text-gray-800 mt-0.5">📍 {tournament.venue.name}</p>
                  </div>
                )}
                {tournament.rules && (
                  <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                    <p className="text-gray-400 text-xs">Rules</p>
                    <p className="text-gray-700 mt-0.5 text-xs leading-relaxed">{tournament.rules}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Organizer */}
            {tournament.organizer && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-3">Organizer</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                    {tournament.organizer.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{tournament.organizer.name}</p>
                    {tournament.organizer.email && <p className="text-xs text-gray-400">{tournament.organizer.email}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Standings Preview */}
            {tournament.standings?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-800">Standings</h3>
                  <button onClick={() => setTab('standings')} className="text-xs text-indigo-600 font-semibold">View All →</button>
                </div>
                <div className="space-y-2">
                  {tournament.standings.slice(0, 4).map((team, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-500'
                        }`}>{i + 1}</span>
                        <span className="font-medium text-gray-800">{team.name}</span>
                      </div>
                      <span className="font-bold text-gray-900">{team.points || 0} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {tab === 'fixtures' && (
          <motion.div key="fixtures" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              {fixtures?.length > 0 ? (
                <FixturesBracket fixtures={fixtures} />
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🏟️</div>
                  <h4 className="font-bold text-gray-800">No Fixtures Yet</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {['upcoming', 'registration'].includes(tournament.status)
                      ? 'Fixtures will be generated once registration closes and the tournament begins.'
                      : 'The organizer has not generated the fixtures yet.'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {tab === 'standings' && (
          <motion.div key="standings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              {standings?.length > 0 ? (
                <PointsTable standings={standings} />
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📊</div>
                  <h4 className="font-bold text-gray-800">No Standings Yet</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Standings will be available once matches have been played.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {tab === 'teams' && (
          <motion.div key="teams" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              {teams.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-800">Registered Teams ({teams.length})</h3>
                  <div className="grid gap-2">
                    {teams.map((team, i) => (
                      <div key={team._id || i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                        <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                          {(team.name || team.user?.name)?.[0]?.toUpperCase() || (i + 1)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm truncate">{team.name || team.user?.name || `Team ${i + 1}`}</p>
                          {team.players?.length > 0 && (
                            <p className="text-xs text-gray-400">{team.players.length} players</p>
                          )}
                        </div>
                        {team.seed && <span className="text-xs text-gray-400 font-mono">#{team.seed}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">👥</div>
                  <h4 className="font-bold text-gray-800">No Teams Registered</h4>
                  <p className="text-sm text-gray-500 mt-1">Be the first to register for this tournament!</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
