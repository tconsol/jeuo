import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { tournamentService } from '../../services/tournament.service';
import { teamService } from '../../services/team.service';
import { useSelector } from 'react-redux';
import { FiArrowLeft, FiUsers, FiCheck, FiX } from 'react-icons/fi';

export default function JoinTournament() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const { data: tournament, isLoading: tournamentLoading } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => tournamentService.getById(tournamentId).then(r => r.data.data.tournament),
  });

  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['my-teams'],
    queryFn: () => teamService.getMyTeams().then(r => r.data.data.teams),
  });

  const joinMutation = useMutation({
    mutationFn: () => tournamentService.requestJoinTournament(tournamentId, {
      teamId: selectedTeam._id,
      teamName: selectedTeam.name,
    }),
    onSuccess: () => {
      navigate(`/tournaments/${tournamentId}`, {
        state: { message: 'Request submitted! Waiting for tournament organizer approval.' },
      });
    },
  });

  const myTeams = teamsData || [];
  const availableTeams = myTeams.filter(team => 
    !tournament?.teams?.some(t => t._id?.toString() === team._id?.toString()) &&
    !tournament?.teamRequests?.some(r => r.team?.toString() === team._id?.toString())
  );

  if (tournamentLoading || teamsLoading) {
    return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin border-4 border-primary-600 border-t-transparent rounded-full w-12 h-12" /></div>;
  }

  if (!tournament) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-600 mb-4">Tournament not found</p>
        <button onClick={() => navigate(-1)} className="text-primary-600 hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-8 text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft size={20} />
          Back
        </button>

        {/* Tournament Info */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            Join {tournament.name}
          </h1>
          <p className="text-gray-600 mb-6">{tournament.description}</p>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-600">Format</p>
              <p className="font-semibold text-gray-900 capitalize">{tournament.format.replace(/_/g, ' ')}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-600">Max Teams</p>
              <p className="font-semibold text-gray-900">
                {tournament.teams?.length || 0}/{tournament.maxTeams}
              </p>
            </div>
            {tournament.entryFee > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Entry Fee</p>
                <p className="font-semibold text-gray-900">${tournament.entryFee}</p>
              </div>
            )}
            {tournament.prizePool > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Prize Pool</p>
                <p className="font-semibold text-gray-900">${tournament.prizePool}</p>
              </div>
            )}
          </div>
        </div>

        {/* Select Team */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <h2 className="text-xl font-display font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiUsers size={24} />
            Select Your Team
          </h2>

          {availableTeams.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                {myTeams.length === 0 
                  ? "You don't have any teams yet. Create one first!"
                  : 'All your teams have already joined or requested to join this tournament.'}
              </p>
              <button
                onClick={() => navigate('/teams/create')}
                className="inline-block px-6 py-2 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700"
              >
                Create Team
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {availableTeams.map((team) => (
                <motion.button
                  key={team._id}
                  type="button"
                  onClick={() => setSelectedTeam(team)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full p-4 rounded-lg border-2 text-left transition ${
                    selectedTeam?._id === team._id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">{team.name}</p>
                      <p className="text-sm text-gray-600">
                        {team.players?.length || 0} players • Captain: {team.owner?.name}
                      </p>
                    </div>
                    {selectedTeam?._id === team._id && (
                      <FiCheck size={20} className="text-primary-600" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        {availableTeams.length > 0 && (
          <button
            onClick={() => joinMutation.mutate()}
            disabled={!selectedTeam || joinMutation.isPending}
            className="w-full px-6 py-3 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-75 disabled:cursor-not-allowed transition"
          >
            {joinMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </button>
        )}
      </div>
    </div>
  );
}
