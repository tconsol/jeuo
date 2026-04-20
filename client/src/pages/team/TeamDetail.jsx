import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SportIcon } from '../../utils/sportIcons';
import { FiAlertTriangle, FiSearch, FiX } from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { teamService } from '../../services';
import api from '../../lib/api';

// sport icons via SportIcon component

export default function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const queryClient = useQueryClient();
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const { data: team, isLoading, error } = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamService.getById(id).then(r => r.data.data),
  });

  const addPlayerMutation = useMutation({
    mutationFn: (data) => teamService.addPlayer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] });
      setShowAddPlayer(false);
      setSearchQuery('');
      setSearchResults([]);
    },
  });

  const removePlayerMutation = useMutation({
    mutationFn: (userId) => teamService.removePlayer(id, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team', id] }),
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data } = await teamService.searchPlayers({ q: searchQuery });
      setSearchResults(data.data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const isOwner = team?.owner?._id === user?._id || team?.owner === user?._id;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
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
        <button onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm">← Go Back</button>
      </div>
    );
  }

  const teamSportIcon = <SportIcon sport={team.sport} size={40} />;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto pt-4 pb-28 px-4 space-y-4">

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
        <div className="flex items-center justify-between mb-3 relative z-10">
          <button onClick={() => navigate('/teams')} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-sm">← Back</button>
          {team.shortName && <span className="bg-white/15 text-white text-xs font-mono px-3 py-1 rounded-full">{team.shortName}</span>}
        </div>
        <div className="relative z-10 text-center">
          <div className="flex justify-center mb-2">{teamSportIcon}</div>
          <h1 className="text-2xl font-black">{team.name}</h1>
          <p className="text-white/60 text-sm mt-1 capitalize">{team.sport?.replace('_', ' ')}</p>
        </div>
        <div className="flex justify-center gap-6 mt-4 relative z-10">
          <div className="text-center">
            <p className="text-2xl font-black">{team.stats?.matchesPlayed || 0}</p>
            <p className="text-white/50 text-xs">Matches</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-emerald-300">{team.stats?.wins || 0}</p>
            <p className="text-white/50 text-xs">Wins</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-red-300">{team.stats?.losses || 0}</p>
            <p className="text-white/50 text-xs">Losses</p>
          </div>
          {team.stats?.winPercentage > 0 && (
            <div className="text-center">
              <p className="text-2xl font-black">{team.stats.winPercentage}%</p>
              <p className="text-white/50 text-xs">Win %</p>
            </div>
          )}
        </div>
      </div>

      {/* Players Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-sm font-bold text-gray-800">Squad ({team.players?.length || 0})</h3>
          {isOwner && (
            <button onClick={() => setShowAddPlayer(!showAddPlayer)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition">
              {showAddPlayer ? <><FiX size={12} className="inline mr-1" />Cancel</> : '+ Add Player'}
            </button>
          )}
        </div>

        <AnimatePresence>
          {showAddPlayer && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="border-b border-gray-100 px-5 py-4 space-y-3 bg-indigo-50/30">
              <div className="flex gap-2">
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by name, email, or phone…"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                />
                <button onClick={handleSearch} disabled={searching}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold transition hover:bg-indigo-700 disabled:opacity-50">
                  {searching ? '…' : <FiSearch size={14} />}
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {searchResults.map(p => {
                    const alreadyInTeam = team.players?.some(tp => (tp.user?._id || tp.user) === p._id);
                    return (
                      <div key={p._id} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-gray-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                            {p.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.email}</p>
                          </div>
                        </div>
                        {alreadyInTeam ? (
                          <span className="text-xs text-gray-400">Already in team</span>
                        ) : (
                          <button
                            onClick={() => addPlayerMutation.mutate({ userId: p._id })}
                            disabled={addPlayerMutation.isPending}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 px-3 py-1 rounded-lg hover:bg-indigo-50 transition"
                          >+ Add</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {searchResults.length === 0 && searchQuery && !searching && (
                <p className="text-xs text-gray-400 text-center py-2">No players found</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="divide-y divide-gray-50">
          {team.players?.length > 0 ? team.players.map((p) => {
            const player = p.user || p;
            const playerId = player._id || player;
            const isCaptain = team.captain === playerId || team.captain?._id === playerId;
            return (
              <div key={playerId} className="flex items-center gap-3 px-5 py-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold">
                  {(player.name || '?')[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-800 text-sm truncate">{player.name || 'Unknown'}</p>
                    {isCaptain && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">C</span>}
                    {p.jerseyNumber && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-mono">#{p.jerseyNumber}</span>}
                  </div>
                  <p className="text-xs text-gray-400 capitalize">{p.role || 'Player'}</p>
                </div>
                {p.status && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    p.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                    p.status === 'inactive' ? 'bg-gray-100 text-gray-500' :
                    'bg-amber-50 text-amber-600'
                  }`}>{p.status}</span>
                )}
                {isOwner && playerId !== user?._id && (
                  <button onClick={() => removePlayerMutation.mutate(playerId)}
                    className="text-xs text-red-400 hover:text-red-600 transition px-2 py-1"><FiX size={12} /></button>
                )}
              </div>
            );
          }) : (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No players yet — add your squad members</p>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {team.description && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-2">About</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{team.description}</p>
        </div>
      )}

      {/* Recent Form */}
      {team.stats?.recentForm?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Recent Form</h3>
          <div className="flex gap-1.5">
            {team.stats.recentForm.map((result, i) => (
              <span key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                result === 'W' ? 'bg-emerald-100 text-emerald-700' :
                result === 'L' ? 'bg-red-100 text-red-600' :
                'bg-gray-100 text-gray-500'
              }`}>{result}</span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
