import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { SportIcon } from '../../utils/sportIcons';
import { FiX, FiUsers } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { teamService } from '../../services';

// sport icons via SportIcon component

export default function Teams() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', shortName: '', sport: 'cricket' });

  const { data: teams, isLoading } = useQuery({
    queryKey: ['my-teams'],
    queryFn: () => teamService.getMyTeams().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => teamService.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      setShowCreate(false);
      setForm({ name: '', shortName: '', sport: 'cricket' });
      navigate(`/teams/${res.data.data._id}`);
    },
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto pt-4 pb-28 px-4 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">My Teams</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create and manage your teams</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition active:scale-95"
        >
          {showCreate ? <><FiX size={12} className="inline mr-1" />Cancel</> : '+ New Team'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h3 className="font-bold text-gray-800">Create Team</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Team Name</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Thunder XI"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Short Name</label>
              <input
                value={form.shortName}
                onChange={e => setForm({ ...form, shortName: e.target.value.toUpperCase().slice(0, 4) })}
                placeholder="THX"
                maxLength={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 uppercase"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Sport</label>
              <select
                value={form.sport}
                onChange={e => setForm({ ...form, sport: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
              >
                {Object.entries(SPORT_ICONS).map(([sport, icon]) => (
                  <option key={sport} value={sport}>{icon} {sport.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={() => createMutation.mutate(form)}
            disabled={!form.name || createMutation.isPending}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition active:scale-95 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating…' : 'Create Team'}
          </button>
          {createMutation.isError && (
            <p className="text-red-500 text-sm text-center">{createMutation.error?.response?.data?.message || 'Failed to create team'}</p>
          )}
        </motion.div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Teams grid */}
      {teams?.length > 0 ? (
        <div className="space-y-3">
          {teams.map(team => (
            <Link key={team._id} to={`/teams/${team._id}`}
              className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-xl">
                  <SportIcon sport={team.sport} size={24} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 truncate">{team.name}</h3>
                    {team.shortName && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg font-mono">{team.shortName}</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">{team.sport?.replace('_', ' ')} • {team.players?.length || 0} players</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{team.stats?.wins || 0}W - {team.stats?.losses || 0}L</p>
                  <p className="text-xs text-gray-400">{team.stats?.matchesPlayed || 0} matches</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : !isLoading && (
        <div className="text-center py-16">
          <div className="flex justify-center mb-4"><FiUsers size={52} className="text-gray-300" /></div>
          <h3 className="text-lg font-bold text-gray-800">No Teams Yet</h3>
          <p className="text-sm text-gray-500 mt-1">Create your first team to get started</p>
        </div>
      )}
    </motion.div>
  );
}
