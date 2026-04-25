import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { tournamentService } from '../../services/tournament.service';
import { teamService } from '../../services/team.service';
import { useSelector } from 'react-redux';
import { SportIcon } from '../../utils/sportIcons';
import { FiArrowLeft, FiUsers, FiCheck, FiCalendar, FiDollarSign, FiAward } from 'react-icons/fi';
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

export default function JoinTournament() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const { data: tournament, isLoading: tLoading } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => tournamentService.getById(tournamentId).then((r) => r.data.data.tournament),
  });

  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['my-teams'],
    queryFn: () => teamService.getMyTeams().then((r) => r.data.data.teams || []),
  });

  const joinMutation = useMutation({
    mutationFn: () => tournamentService.requestJoinTournament(tournamentId, {
      teamId: selectedTeam._id,
      teamName: selectedTeam.name,
    }),
    onSuccess: () => {
      toast.success('Request submitted!');
      navigate(`/tournaments/${tournamentId}`, {
        state: { message: 'Request submitted! Waiting for organizer approval.' },
      });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit request'),
  });

  const myTeams = teamsData || [];
  const availableTeams = myTeams.filter((team) =>
    !tournament?.teams?.some((t) => t._id?.toString() === team._id?.toString()) &&
    !tournament?.teamRequests?.some((r) => r.team?.toString() === team._id?.toString())
  );

  const gradient = SPORT_GRADIENTS[tournament?.sport] || 'from-indigo-500 to-violet-600';

  if (tLoading || teamsLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-gray-500 font-medium">Tournament not found</p>
        <button onClick={() => navigate(-1)} className="text-indigo-600 text-sm font-semibold hover:underline">← Go back</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 pb-24">

      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition font-medium">
        <FiArrowLeft size={15} /> Back
      </button>

      {/* Tournament hero card */}
      <div className={`bg-gradient-to-br ${gradient} rounded-3xl p-6 mb-5 text-white shadow-xl relative overflow-hidden`}>
        <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/10 rounded-full" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
              <SportIcon sport={tournament.sport} size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black leading-tight">{tournament.name}</h1>
              <p className="text-white/60 text-xs mt-0.5 capitalize">
                {tournament.sport?.replace('_', ' ')} · {tournament.format?.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <p className="text-sm font-black">
                {tournament.teams?.length || 0}<span className="text-white/60 font-normal text-xs">/{tournament.maxTeams}</span>
              </p>
              <p className="text-white/50 text-[10px] mt-0.5">Teams</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <p className="text-sm font-black">
                {tournament.entryFee > 0 ? `₹${tournament.entryFee}` : 'Free'}
              </p>
              <p className="text-white/50 text-[10px] mt-0.5">Entry</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <p className={`text-sm font-black ${tournament.prizePool > 0 ? 'text-yellow-300' : ''}`}>
                {tournament.prizePool > 0 ? `₹${tournament.prizePool >= 1000 ? `${(tournament.prizePool/1000).toFixed(0)}K` : tournament.prizePool}` : '—'}
              </p>
              <p className="text-white/50 text-[10px] mt-0.5">Prize</p>
            </div>
          </div>
        </div>
      </div>

      {/* Select team */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <FiUsers size={16} className="text-indigo-600" />
          <h2 className="font-black text-gray-900">Select Your Team</h2>
        </div>

        {availableTeams.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-gray-100">
              <FiUsers size={26} className="text-gray-300" />
            </div>
            <p className="font-bold text-gray-700 text-sm">
              {myTeams.length === 0 ? "You don't have any teams yet" : 'All your teams have already joined or requested'}
            </p>
            {myTeams.length === 0 && (
              <button onClick={() => navigate('/teams')}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition">
                Create a Team
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {availableTeams.map((team) => {
              const activePlayers = team.players?.filter((p) => p.status === 'active')?.length || 0;
              const isSelected = selectedTeam?._id === team._id;
              return (
                <motion.button key={team._id} type="button"
                  onClick={() => setSelectedTeam(isSelected ? null : team)}
                  whileTap={{ scale: 0.99 }}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                    isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}>
                  <div className={`w-11 h-11 bg-gradient-to-br ${SPORT_GRADIENTS[team.sport] || 'from-indigo-500 to-violet-600'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <SportIcon sport={team.sport} size={22} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${isSelected ? 'text-indigo-700' : 'text-gray-900'}`}>{team.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{activePlayers} players · {team.owner?.name}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <FiCheck size={13} className="text-white" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Submit */}
      {availableTeams.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => joinMutation.mutate()}
            disabled={!selectedTeam || joinMutation.isPending}
            className={`w-full py-3.5 rounded-2xl font-black text-sm transition active:scale-95 disabled:opacity-50 shadow-lg ${
              selectedTeam
                ? `bg-gradient-to-r ${gradient} text-white shadow-indigo-200`
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}>
            {joinMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…
              </span>
            ) : selectedTeam ? `Request to Join with ${selectedTeam.name}` : 'Select a team to continue'}
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">The organizer will review your request</p>
        </div>
      )}
    </div>
  );
}
