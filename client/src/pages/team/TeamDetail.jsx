import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SportIcon } from '../../utils/sportIcons';
import { FiAlertTriangle, FiSearch, FiX, FiUserPlus, FiTrash2, FiArrowLeft, FiCheck, FiUser } from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { teamService } from '../../services';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const SPORT_GRADIENTS = {
  cricket:      'from-emerald-500 to-green-600',
  football:     'from-blue-500 to-indigo-600',
  basketball:   'from-orange-500 to-red-500',
  tennis:       'from-yellow-400 to-amber-500',
  badminton:    'from-violet-500 to-purple-600',
  volleyball:   'from-pink-500 to-rose-600',
  table_tennis: 'from-cyan-500 to-teal-600',
};

export default function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const queryClient = useQueryClient();
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: team, isLoading, error } = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamService.getById(id).then((r) => r.data?.data?.team || r.data?.data),
  });

  const addPlayerMutation = useMutation({
    mutationFn: (data) => teamService.addPlayer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] });
      toast.success('Player invited!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add player'),
  });

  const removePlayerMutation = useMutation({
    mutationFn: (userId) => teamService.removePlayer(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] });
      toast.success('Player removed');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteTeamMutation = useMutation({
    mutationFn: () => api.delete(`/teams/${id}`),
    onSuccess: () => {
      toast.success('Team deleted');
      navigate('/teams');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data } = await api.get('/teams/search-players', { params: { q: searchQuery } });
      setSearchResults(data?.data?.players || []);
    } catch {
      setSearchResults([]);
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const isOwner = team?.owner?._id === user?._id || team?.owner === user?._id;
  const gradient = SPORT_GRADIENTS[team?.sport] || 'from-indigo-500 to-violet-600';

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading team…</p>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <FiAlertTriangle size={28} className="text-red-500" />
        </div>
        <p className="text-red-600 font-medium">Team not found</p>
        <button onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm transition">
          ← Go Back
        </button>
      </div>
    );
  }

  const activePlayers = team.players?.filter((p) => p.status === 'active') || [];
  const invitedPlayers = team.players?.filter((p) => p.status === 'invited') || [];

  const isAlreadyInTeam = (userId) =>
    team.players?.some((p) => (p.user?._id || p.user) === userId && p.status !== 'removed');

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 pb-28">

      {/* Back */}
      <button onClick={() => navigate('/teams')}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition font-medium">
        <FiArrowLeft size={15} /> My Teams
      </button>

      {/* Hero */}
      <div className={`bg-gradient-to-br ${gradient} rounded-3xl p-6 mb-5 text-white shadow-xl relative overflow-hidden`}>
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-black/10 rounded-full blur-3xl" />
        <div className="relative text-center">
          <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <SportIcon sport={team.sport} size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black">{team.name}</h1>
          {team.shortName && (
            <span className="inline-block mt-1 bg-white/20 text-white text-xs font-mono px-3 py-0.5 rounded-full">{team.shortName}</span>
          )}
          <p className="text-white/60 text-sm mt-1 capitalize">{team.sport?.replace('_', ' ')}</p>
        </div>
        <div className="flex justify-center gap-8 mt-5 relative">
          {[
            { val: team.stats?.matchesPlayed || 0, label: 'Matches' },
            { val: team.stats?.wins || 0, label: 'Wins' },
            { val: team.stats?.losses || 0, label: 'Losses' },
            { val: activePlayers.length, label: 'Players' },
          ].map(({ val, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-black">{val}</p>
              <p className="text-white/50 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Owner info + actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white font-black text-sm`}>
            {team.owner?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{team.owner?.name}</p>
            <p className="text-xs text-gray-400">Team Owner</p>
          </div>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <button onClick={() => setShowAddPlayer(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition active:scale-95">
              <FiUserPlus size={13} /> Add Player
            </button>
            <button onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition">
              <FiTrash2 size={13} /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Active squad */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Squad ({activePlayers.length})
        </h2>
        {activePlayers.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No active players yet</p>
        ) : (
          <div className="space-y-2.5">
            {activePlayers.map((p) => (
              <div key={p.user?._id || p._id} className="flex items-center gap-3">
                <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white text-sm font-black flex-shrink-0`}>
                  {p.user?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{p.user?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-400 capitalize">{p.role?.replace('_', ' ') || 'Player'}</p>
                </div>
                {(p.user?._id === team.owner?._id || p.user === team.owner) && (
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">Captain</span>
                )}
                {isOwner && p.user?._id !== user?._id && (
                  <button onClick={() => removePlayerMutation.mutate(p.user?._id)}
                    disabled={removePlayerMutation.isPending}
                    className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition flex-shrink-0">
                    <FiX size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invited players */}
      {invitedPlayers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Pending Invites ({invitedPlayers.length})
          </h2>
          <div className="space-y-2.5">
            {invitedPlayers.map((p) => (
              <div key={p.user?._id || p._id} className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 text-sm font-black flex-shrink-0">
                  {p.user?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{p.user?.name || 'Unknown'}</p>
                  <p className="text-xs text-amber-500">Invite pending</p>
                </div>
                {isOwner && (
                  <button onClick={() => removePlayerMutation.mutate(p.user?._id)}
                    className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition flex-shrink-0">
                    <FiX size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Player Modal */}
      <AnimatePresence>
        {showAddPlayer && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h3 className="font-black text-gray-900">Add Player</h3>
                <button onClick={() => { setShowAddPlayer(false); setSearchQuery(''); setSearchResults([]); }}
                  className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
                  <FiX size={15} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-xs text-gray-400">Search players by name, email, or phone number</p>
                <div className="flex gap-2">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Email, phone, or name…"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <button onClick={handleSearch} disabled={searching}
                    className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-60">
                    {searching
                      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                      : <FiSearch size={15} />}
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {searchResults.length === 0 && searchQuery && !searching && (
                    <p className="text-sm text-gray-400 text-center py-6">No players found</p>
                  )}
                  {searchResults.map((player) => {
                    const inTeam = isAlreadyInTeam(player._id);
                    return (
                      <div key={player._id}
                        className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 bg-gray-50">
                        <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0`}>
                          {player.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm">{player.name}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                            {player.email && <p className="text-[11px] text-gray-400">{player.email}</p>}
                            {player.phone && <p className="text-[11px] text-gray-400">{player.phone}</p>}
                          </div>
                          {player.sports?.length > 0 && (
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {player.sports.slice(0, 3).map((s) => (
                                <span key={s} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded capitalize">{s.replace('_', ' ')}</span>
                              ))}
                            </div>
                          )}
                          {player.skillLevel && (
                            <p className="text-[11px] text-gray-400 capitalize mt-0.5">Level: {player.skillLevel}</p>
                          )}
                        </div>
                        {inTeam ? (
                          <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 flex-shrink-0">
                            <FiCheck size={10} /> Added
                          </span>
                        ) : (
                          <button
                            onClick={() => addPlayerMutation.mutate({ userId: player._id })}
                            disabled={addPlayerMutation.isPending}
                            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-60 flex-shrink-0">
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
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiAlertTriangle size={26} className="text-red-500" />
            </div>
            <h3 className="font-black text-gray-900 text-lg">Delete Team?</h3>
            <p className="text-sm text-gray-500 mt-2 mb-6">
              <span className="font-semibold">"{team.name}"</span> will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={() => deleteTeamMutation.mutate()} disabled={deleteTeamMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition disabled:opacity-60">
                {deleteTeamMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
