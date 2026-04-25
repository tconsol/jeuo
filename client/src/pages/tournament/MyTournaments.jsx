import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { SportIcon } from '../../utils/sportIcons';
import api from '../../lib/api';
import {
  FiPlus, FiUsers, FiCalendar, FiSettings, FiTrash2,
  FiSearch, FiX, FiCheck, FiAlertTriangle, FiChevronRight,
  FiUnlock, FiLock, FiPlay,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
  draft:               { bg: 'bg-gray-100',    text: 'text-gray-500',    label: 'Draft'      },
  registration_open:   { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Open'       },
  registration_closed: { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Closed'     },
  in_progress:         { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'Live'       },
  completed:           { bg: 'bg-gray-100',    text: 'text-gray-400',    label: 'Completed'  },
  cancelled:           { bg: 'bg-red-100',     text: 'text-red-600',     label: 'Cancelled'  },
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

function AddTeamModal({ tournament, onClose, onAdded }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (teamId) => api.post(`/tournaments/${tournament._id}/add-team`, { teamId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
      toast.success('Team added!');
      onAdded?.();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add team'),
  });

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const { data } = await api.get('/teams/search', { params: { query } });
      setResults(data.data?.teams || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const alreadyAdded = (teamId) =>
    tournament.teams?.some((t) => t._id?.toString() === teamId.toString());

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-black text-gray-900">Add Team to Tournament</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
            <FiX size={15} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-500">
            {tournament.teams?.length || 0}/{tournament.maxTeams} teams registered
          </p>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by team name…"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button onClick={handleSearch} disabled={searching}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-60">
              {searching ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> : <FiSearch size={15} />}
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results.length === 0 && query && !searching && (
              <p className="text-sm text-gray-400 text-center py-6">No teams found for "{query}"</p>
            )}
            {results.map((team) => {
              const added = alreadyAdded(team._id);
              const activePlayers = team.players?.filter((p) => p.status === 'active')?.length || 0;
              return (
                <div key={team._id}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <SportIcon sport={team.sport} size={20} className="text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{team.name}</p>
                    <p className="text-xs text-gray-400">{activePlayers} players · {team.owner?.name}</p>
                  </div>
                  {added ? (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                      <FiCheck size={11} /> Added
                    </span>
                  ) : (
                    <button
                      onClick={() => addMutation.mutate(team._id)}
                      disabled={addMutation.isPending}
                      className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-60">
                      Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function MyTournaments() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [addTeamFor, setAddTeamFor] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-tournaments'],
    queryFn: () => api.get('/tournaments/my').then((r) => r.data.data.tournaments || []),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/tournaments/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
      toast.success('Status updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/tournaments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
      toast.success('Tournament deleted');
      setDeleteConfirm(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const removeTeamMutation = useMutation({
    mutationFn: ({ tournamentId, teamId }) => api.delete(`/tournaments/${tournamentId}/teams/${teamId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
      toast.success('Team removed');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const tournaments = data || [];
  const active = tournaments.filter((t) => !['completed', 'cancelled'].includes(t.status));
  const past = tournaments.filter((t) => ['completed', 'cancelled'].includes(t.status));

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 pb-28">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">My Tournaments</h1>
          <p className="text-gray-400 text-xs mt-0.5">{tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''} created</p>
        </div>
        <button onClick={() => navigate('/tournaments/create')}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition active:scale-95">
          <FiPlus size={14} /> New
        </button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && tournaments.length === 0 && (
        <div className="text-center py-24">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-indigo-100">
            <FiCalendar size={36} className="text-indigo-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">No tournaments yet</h3>
          <p className="text-sm text-gray-400 mt-1 mb-6">Create your first tournament and start competing</p>
          <button onClick={() => navigate('/tournaments/create')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition">
            <FiPlus size={15} /> Create Tournament
          </button>
        </div>
      )}

      {!isLoading && active.length > 0 && (
        <section className="mb-8 space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active</h2>
          {active.map((t, i) => (
            <TournamentCard
              key={t._id} t={t} i={i}
              onAddTeam={() => setAddTeamFor(t)}
              onDelete={() => setDeleteConfirm(t)}
              onStatusChange={(status) => statusMutation.mutate({ id: t._id, status })}
              onRemoveTeam={(teamId) => removeTeamMutation.mutate({ tournamentId: t._id, teamId })}
              statusPending={statusMutation.isPending}
            />
          ))}
        </section>
      )}

      {!isLoading && past.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Past</h2>
          {past.map((t, i) => (
            <TournamentCard
              key={t._id} t={t} i={i}
              onAddTeam={() => setAddTeamFor(t)}
              onDelete={() => setDeleteConfirm(t)}
              onStatusChange={(status) => statusMutation.mutate({ id: t._id, status })}
              onRemoveTeam={(teamId) => removeTeamMutation.mutate({ tournamentId: t._id, teamId })}
              statusPending={statusMutation.isPending}
            />
          ))}
        </section>
      )}

      {/* Add Team Modal */}
      {addTeamFor && (
        <AddTeamModal
          tournament={addTeamFor}
          onClose={() => setAddTeamFor(null)}
          onAdded={() => setAddTeamFor(null)}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiAlertTriangle size={26} className="text-red-500" />
            </div>
            <h3 className="font-black text-gray-900 text-lg">Delete Tournament?</h3>
            <p className="text-sm text-gray-500 mt-2 mb-6">
              <span className="font-semibold">"{deleteConfirm.name}"</span> will be permanently deleted along with all its data.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={() => deleteMutation.mutate(deleteConfirm._id)} disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition disabled:opacity-60">
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function TournamentCard({ t, i, onAddTeam, onDelete, onStatusChange, onRemoveTeam, statusPending }) {
  const navigate = useNavigate();
  const [showTeams, setShowTeams] = useState(false);
  const gradient = SPORT_GRADIENTS[t.sport] || 'from-indigo-500 to-purple-600';
  const badge = STATUS_BADGE[t.status] || STATUS_BADGE.draft;
  const pendingCount = t.teamRequests?.filter((r) => r.status === 'pending').length || 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* Top stripe */}
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-11 h-11 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
            <SportIcon sport={t.sport} size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-gray-900 text-base truncate">{t.name}</h3>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                {badge.label}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">
              {t.sport?.replace('_', ' ')} · {t.format?.replace(/_/g, ' ')}
            </p>
          </div>
          <Link to={`/tournaments/${t._id}`}
            className="flex items-center gap-1 text-xs text-indigo-600 font-bold flex-shrink-0 hover:text-indigo-700 transition">
            View <FiChevronRight size={13} />
          </Link>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-sm font-black text-gray-900">{t.teams?.length || 0}<span className="text-gray-400 font-normal text-xs">/{t.maxTeams}</span></p>
            <p className="text-[10px] text-gray-400 mt-0.5">Teams</p>
          </div>
          {pendingCount > 0 && (
            <div className="flex-1 bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-sm font-black text-amber-700">{pendingCount}</p>
              <p className="text-[10px] text-amber-500 mt-0.5">Pending</p>
            </div>
          )}
          {t.entryFee > 0 ? (
            <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-sm font-black text-gray-900">₹{t.entryFee}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Entry</p>
            </div>
          ) : null}
          {t.prizePool > 0 ? (
            <div className="flex-1 bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-sm font-black text-amber-600">₹{t.prizePool >= 1000 ? `${(t.prizePool/1000).toFixed(0)}K` : t.prizePool}</p>
              <p className="text-[10px] text-amber-400 mt-0.5">Prize</p>
            </div>
          ) : null}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mb-3">
          {/* Status controls */}
          {t.status === 'draft' && (
            <button onClick={() => onStatusChange('registration_open')} disabled={statusPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition disabled:opacity-60">
              <FiUnlock size={12} /> Open Reg
            </button>
          )}
          {t.status === 'registration_open' && (
            <button onClick={() => onStatusChange('registration_closed')} disabled={statusPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100 transition disabled:opacity-60">
              <FiLock size={12} /> Close Reg
            </button>
          )}
          {t.status === 'registration_closed' && (t.teams?.length || 0) >= 2 && (
            <button onClick={() => onStatusChange('in_progress')} disabled={statusPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition disabled:opacity-60">
              <FiPlay size={12} /> Start
            </button>
          )}

          {/* Add team */}
          {['draft', 'registration_open', 'registration_closed'].includes(t.status) && (
            <button onClick={onAddTeam}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition">
              <FiUsers size={12} /> Add Team
            </button>
          )}

          {/* Team requests */}
          {pendingCount > 0 && (
            <button onClick={() => navigate(`/tournaments/${t._id}/requests`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 text-xs font-bold hover:bg-violet-100 transition">
              <FiSettings size={12} /> Requests
              <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            </button>
          )}

          {/* Toggle team list */}
          {(t.teams?.length || 0) > 0 && (
            <button onClick={() => setShowTeams(!showTeams)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition">
              <FiUsers size={12} /> Teams ({t.teams.length})
            </button>
          )}

          {/* Delete */}
          <button onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition ml-auto">
            <FiTrash2 size={12} /> Delete
          </button>
        </div>

        {/* Team list */}
        <AnimatePresence>
          {showTeams && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden">
              <div className="pt-3 border-t border-gray-100 space-y-2">
                {t.teams.map((team) => (
                  <div key={team._id} className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3.5 py-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black flex-shrink-0">
                      {team.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{team.name}</p>
                      {team.players?.length > 0 && (
                        <p className="text-[10px] text-gray-400">{team.players.length} players</p>
                      )}
                    </div>
                    {['draft', 'registration_open', 'registration_closed'].includes(t.status) && (
                      <button onClick={() => onRemoveTeam(team._id)}
                        className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition flex-shrink-0">
                        <FiX size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
