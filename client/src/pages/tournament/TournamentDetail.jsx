import { useParams, useNavigate } from 'react-router-dom';
import { SportIcon } from '../../utils/sportIcons';
import {
  FiAlertTriangle, FiAward, FiList, FiGrid, FiBarChart2,
  FiUsers, FiMapPin, FiDollarSign, FiCheck, FiArrowLeft,
  FiSettings, FiUserPlus, FiLock, FiUnlock,
} from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { tournamentService } from '../../services';
import { FixturesBracket, PointsTable } from '../../components/tournament';
import { useState } from 'react';
import api from '../../lib/api';

const STATUS_STYLES = {
  draft:               { bg: 'bg-gray-100',    text: 'text-gray-500',    label: 'Draft'             },
  registration_open:   { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Registration Open' },
  registration_closed: { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Registration Closed'},
  in_progress:         { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'In Progress'       },
  completed:           { bg: 'bg-gray-100',    text: 'text-gray-400',    label: 'Completed'         },
  cancelled:           { bg: 'bg-red-100',     text: 'text-red-600',     label: 'Cancelled'         },
};

const FORMAT_LABELS = {
  single_elimination: 'Single Elimination',
  double_elimination: 'Double Elimination',
  round_robin:        'Round Robin',
  group_knockout:     'Group Stage + Knockout',
  league:             'League',
};

const SPORT_GRADIENTS = {
  cricket:      'from-emerald-500 to-green-600',
  football:     'from-blue-500 to-indigo-600',
  basketball:   'from-orange-500 to-red-500',
  tennis:       'from-yellow-400 to-amber-500',
  badminton:    'from-violet-500 to-purple-600',
  volleyball:   'from-pink-500 to-rose-600',
  table_tennis: 'from-cyan-500 to-teal-600',
};

function fmt(d) {
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
    queryFn: () => tournamentService.getById(id).then((r) => r.data.data.tournament),
  });

  const { data: fixtures } = useQuery({
    queryKey: ['tournament-fixtures', id],
    queryFn: () => tournamentService.getFixtures(id).then((r) => r.data.data.fixtures || []),
    enabled: tab === 'fixtures',
  });

  const { data: standings } = useQuery({
    queryKey: ['tournament-standings', id],
    queryFn: () => tournamentService.getStandings(id).then((r) => r.data.data.standings || []),
    enabled: tab === 'standings',
  });

  const openRegMutation = useMutation({
    mutationFn: () => api.patch(`/tournaments/${id}/status`, { status: 'registration_open' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tournament', id] }),
  });

  const closeRegMutation = useMutation({
    mutationFn: () => api.patch(`/tournaments/${id}/status`, { status: 'registration_closed' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tournament', id] }),
  });

  const startMutation = useMutation({
    mutationFn: () => api.patch(`/tournaments/${id}/status`, { status: 'in_progress' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tournament', id] }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading tournament…</p>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <FiAlertTriangle size={28} className="text-red-500" />
        </div>
        <p className="text-red-600 font-semibold">{error?.response?.data?.message || 'Tournament not found'}</p>
        <button onClick={() => navigate(-1)}
          className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm font-medium">
          ← Go Back
        </button>
      </div>
    );
  }

  const gradient   = SPORT_GRADIENTS[tournament.sport] || 'from-indigo-600 to-purple-700';
  const statusStyle = STATUS_STYLES[tournament.status] || STATUS_STYLES.draft;
  const teams       = tournament.teams || [];
  const isOrganizer = tournament.creator?._id === user?._id || tournament.creator === user?._id;
  const maxTeams    = tournament.maxTeams || 0;
  const slotsLeft   = maxTeams - teams.length;

  const isRegistered = isOrganizer || teams.some((t) =>
    t.captain === user?._id || t.captain?._id === user?._id ||
    t.players?.some((p) => p === user?._id || p?._id === user?._id)
  );

  const canJoin = tournament.status === 'registration_open' && !isRegistered && !isOrganizer && slotsLeft > 0;
  const canOpenReg = isOrganizer && tournament.status === 'draft';
  const canCloseReg = isOrganizer && tournament.status === 'registration_open';
  const canStart = isOrganizer && tournament.status === 'registration_closed' && teams.length >= 2;

  const TABS = [
    { id: 'overview',  label: 'Overview',  Icon: FiList      },
    { id: 'fixtures',  label: 'Fixtures',  Icon: FiGrid      },
    { id: 'standings', label: 'Standings', Icon: FiBarChart2 },
    { id: 'teams',     label: 'Teams',     Icon: FiUsers     },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero ─────────────────────────────────────── */}
      <div className={`bg-gradient-to-br ${gradient} text-white`}>
        <div className="max-w-4xl mx-auto px-4 pt-5 pb-8">
          {/* Back + status */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-white/80 hover:text-white transition text-sm font-medium">
              <FiArrowLeft size={16} /> Back
            </button>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
              {statusStyle.label}
            </span>
          </div>

          {/* Name & sport */}
          <div className="flex flex-col items-center text-center gap-3 py-2">
            <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <SportIcon sport={tournament.sport} size={32} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black leading-tight">{tournament.name}</h1>
              {tournament.description && (
                <p className="text-white/65 text-sm mt-2 max-w-lg mx-auto">{tournament.description}</p>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap justify-center gap-5 sm:gap-8 mt-6">
            {fmt(tournament.startDate) && (
              <div className="text-center">
                <p className="text-white/50 text-[11px] uppercase tracking-wider">Start</p>
                <p className="text-sm font-bold mt-0.5">{fmt(tournament.startDate)}</p>
              </div>
            )}
            {fmt(tournament.endDate) && (
              <div className="text-center">
                <p className="text-white/50 text-[11px] uppercase tracking-wider">End</p>
                <p className="text-sm font-bold mt-0.5">{fmt(tournament.endDate)}</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-white/50 text-[11px] uppercase tracking-wider">Teams</p>
              <p className="text-sm font-bold mt-0.5">{teams.length}{maxTeams ? `/${maxTeams}` : ''}</p>
            </div>
            {tournament.prizePool > 0 && (
              <div className="text-center">
                <p className="text-white/50 text-[11px] uppercase tracking-wider">Prize</p>
                <p className="text-sm font-bold mt-0.5 text-yellow-300">₹{tournament.prizePool.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-3 pb-28 space-y-4">

        {/* ── Action Cards ─────────────────────────────── */}

        {/* Join button for participants */}
        {canJoin && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-900">Join this Tournament</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} remaining
                  {tournament.entryFee > 0 ? ` · Entry fee ₹${tournament.entryFee}` : ' · Free entry'}
                </p>
              </div>
              <button
                onClick={() => navigate(`/tournaments/${id}/join`)}
                className="flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition active:scale-95"
              >
                <FiUserPlus size={15} /> Join Tournament
              </button>
            </div>
          </motion.div>
        )}

        {/* Already registered badge */}
        {isRegistered && !isOrganizer && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <FiCheck size={16} className="text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-emerald-800 text-sm">Your team is registered</p>
              <p className="text-emerald-600 text-xs mt-0.5">Good luck in the tournament!</p>
            </div>
          </div>
        )}

        {/* Organizer controls */}
        {isOrganizer && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <FiSettings size={15} className="text-indigo-500" />
              <h3 className="font-bold text-gray-900 text-sm">Organizer Controls</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Manage requests */}
              <button
                onClick={() => navigate(`/tournaments/${id}/requests`)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition"
              >
                <FiUsers size={14} /> Team Requests
                {tournament.teamRequests?.filter(r => r.status === 'pending').length > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {tournament.teamRequests.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>

              {/* Open Registration */}
              {canOpenReg && (
                <button
                  onClick={() => openRegMutation.mutate()}
                  disabled={openRegMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition disabled:opacity-60"
                >
                  <FiUnlock size={14} /> Open Registration
                </button>
              )}

              {/* Close Registration */}
              {canCloseReg && (
                <button
                  onClick={() => closeRegMutation.mutate()}
                  disabled={closeRegMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition disabled:opacity-60"
                >
                  <FiLock size={14} /> Close Registration
                </button>
              )}

              {/* Start Tournament */}
              {canStart && (
                <button
                  onClick={() => startMutation.mutate()}
                  disabled={startMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition disabled:opacity-60"
                >
                  ▶ Start Tournament
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Tabs ─────────────────────────────────────── */}
        <div className="flex bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {TABS.map(({ id: tabId, label, Icon }) => (
            <button key={tabId} onClick={() => setTab(tabId)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-semibold transition-all ${
                tab === tabId
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ──────────────────────────────── */}
        <AnimatePresence mode="wait">

          {/* Overview */}
          {tab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-4">

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-4">Tournament Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-xl p-3.5">
                    <p className="text-gray-400 text-xs mb-1">Sport</p>
                    <p className="font-semibold text-gray-800 capitalize flex items-center gap-1.5">
                      <SportIcon sport={tournament.sport} size={14} />
                      {tournament.sport?.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3.5">
                    <p className="text-gray-400 text-xs mb-1">Format</p>
                    <p className="font-semibold text-gray-800">{FORMAT_LABELS[tournament.format] || tournament.format}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3.5">
                    <p className="text-gray-400 text-xs mb-1">Entry Fee</p>
                    <p className="font-bold text-gray-800">{tournament.entryFee > 0 ? `₹${tournament.entryFee}` : 'Free'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3.5">
                    <p className="text-gray-400 text-xs mb-1">Prize Pool</p>
                    <p className="font-bold text-amber-600">{tournament.prizePool > 0 ? `₹${tournament.prizePool.toLocaleString()}` : '—'}</p>
                  </div>
                  {tournament.playersPerTeam && (
                    <div className="bg-gray-50 rounded-xl p-3.5">
                      <p className="text-gray-400 text-xs mb-1">Players / Team</p>
                      <p className="font-semibold text-gray-800">{tournament.playersPerTeam}</p>
                    </div>
                  )}
                  {tournament.registrationDeadline && (
                    <div className="bg-gray-50 rounded-xl p-3.5">
                      <p className="text-gray-400 text-xs mb-1">Reg. Deadline</p>
                      <p className="font-semibold text-gray-800">{fmt(tournament.registrationDeadline)}</p>
                    </div>
                  )}
                  {tournament.location?.city && (
                    <div className="bg-gray-50 rounded-xl p-3.5 col-span-2">
                      <p className="text-gray-400 text-xs mb-1">Location</p>
                      <p className="font-semibold text-gray-800 flex items-center gap-1.5">
                        <FiMapPin size={12} />
                        {tournament.location.city}{tournament.location.state ? `, ${tournament.location.state}` : ''}
                      </p>
                    </div>
                  )}
                  {tournament.rules && (
                    <div className="bg-gray-50 rounded-xl p-3.5 col-span-2">
                      <p className="text-gray-400 text-xs mb-1">Rules</p>
                      <p className="text-gray-700 text-xs leading-relaxed">{tournament.rules}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Organizer card */}
              {tournament.creator && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="text-sm font-bold text-gray-800 mb-3">Organizer</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                      {tournament.creator.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{tournament.creator.name}</p>
                      {tournament.creator.email && <p className="text-xs text-gray-400">{tournament.creator.email}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Top standings preview */}
              {tournament.pointsTable?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-800">Top Teams</h3>
                    <button onClick={() => setTab('standings')}
                      className="text-xs text-indigo-600 font-semibold">View All →</button>
                  </div>
                  <div className="space-y-2">
                    {tournament.pointsTable.slice(0, 4).map((team, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                            i === 0 ? 'bg-yellow-100 text-yellow-700' :
                            i === 1 ? 'bg-gray-100 text-gray-600' :
                            i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400'
                          }`}>{i + 1}</span>
                          <span className="font-semibold text-gray-800 text-sm">{team.teamName || team.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          {tournament.sport === 'cricket' && (
                            <span className={`text-xs font-semibold ${(team.netRunRate || 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              NRR {(team.netRunRate >= 0 ? '+' : '')}{(team.netRunRate || 0).toFixed(2)}
                            </span>
                          )}
                          <span className="font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg">{team.points || 0} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Fixtures */}
          {tab === 'fixtures' && (
            <motion.div key="fixtures" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                {fixtures?.length > 0 ? (
                  <FixturesBracket fixtures={fixtures} />
                ) : (
                  <div className="text-center py-14">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <FiGrid size={28} className="text-gray-300" />
                    </div>
                    <h4 className="font-bold text-gray-800">No Fixtures Yet</h4>
                    <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
                      {['registration_open', 'registration_closed', 'draft'].includes(tournament.status)
                        ? 'Fixtures will be generated once the tournament begins.'
                        : 'The organizer has not generated fixtures yet.'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Standings */}
          {tab === 'standings' && (
            <motion.div key="standings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {standings?.length > 0 ? (
                <PointsTable standings={standings} sport={tournament.sport} tournament={tournament} />
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center py-14">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <FiBarChart2 size={28} className="text-gray-300" />
                  </div>
                  <h4 className="font-bold text-gray-800">No Standings Yet</h4>
                  <p className="text-sm text-gray-400 mt-1">Standings appear once matches are played.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Teams */}
          {tab === 'teams' && (
            <motion.div key="teams" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                {teams.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-800">
                      Registered Teams ({teams.length}{maxTeams ? `/${maxTeams}` : ''})
                    </h3>
                    <div className="space-y-2">
                      {teams.map((team, i) => (
                        <div key={team._id || i}
                          className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3.5">
                          <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-black">
                            {team.name?.[0]?.toUpperCase() || (i + 1)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm truncate">{team.name || `Team ${i + 1}`}</p>
                            {team.players?.length > 0 && (
                              <p className="text-xs text-gray-400">{team.players.length} players</p>
                            )}
                          </div>
                          {team.seed && <span className="text-xs text-gray-400 font-mono bg-white px-2 py-0.5 rounded-lg border border-gray-200">#{team.seed}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-14">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <FiUsers size={28} className="text-gray-300" />
                    </div>
                    <h4 className="font-bold text-gray-800">No Teams Registered</h4>
                    <p className="text-sm text-gray-400 mt-1">Be the first to join this tournament!</p>
                    {canJoin && (
                      <button onClick={() => navigate(`/tournaments/${id}/join`)}
                        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition">
                        <FiUserPlus size={14} /> Join Tournament
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
