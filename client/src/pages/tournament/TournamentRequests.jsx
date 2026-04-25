import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { tournamentService } from '../../services/tournament.service';
import { useSelector } from 'react-redux';
import { FiArrowLeft, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';

export default function TournamentRequests() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);
  const queryClient = useQueryClient();
  const [rejectingIndex, setRejectingIndex] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: tournament, isLoading } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => tournamentService.getById(tournamentId).then(r => r.data.data.tournament),
  });

  const { data: requests = [] } = useQuery({
    queryKey: ['tournament-requests', tournamentId],
    queryFn: () => tournamentService.getTeamRequests(tournamentId).then(r => r.data.data.teamRequests),
  });

  const approveMutation = useMutation({
    mutationFn: (requestIndex) => tournamentService.approveTeamRequest(tournamentId, requestIndex),
    onSuccess: () => {
      queryClient.invalidateQueries(['tournament-requests', tournamentId]);
      queryClient.invalidateQueries(['tournament', tournamentId]);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ requestIndex, reason }) => 
      tournamentService.rejectTeamRequest(tournamentId, requestIndex, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['tournament-requests', tournamentId]);
      setRejectingIndex(null);
      setRejectionReason('');
    },
  });

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin border-4 border-primary-600 border-t-transparent rounded-full w-12 h-12" /></div>;
  }

  // Only tournament creator can see this
  if (tournament?.creator?._id !== user?._id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <FiAlertCircle size={48} className="text-red-500 mb-4" />
        <p className="text-gray-600 mb-4">You don't have permission to view this page</p>
        <button onClick={() => navigate(-1)} className="text-primary-600 hover:underline">Go back</button>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-8 text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft size={20} />
          Back
        </button>

        <h1 className="text-3xl font-display font-bold text-gray-900 mb-8">
          {tournament.name} - Team Requests
        </h1>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
            <h2 className="text-xl font-display font-bold text-gray-900 mb-6">
              Pending Requests ({pendingRequests.length})
            </h2>

            <div className="space-y-4">
              <AnimatePresence>
                {pendingRequests.map((request, idx) => (
                  <motion.div
                    key={request._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-6 border border-yellow-200 bg-yellow-50 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{request.teamName}</h3>
                        <p className="text-sm text-gray-600">
                          Captain: {request.captain.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Requested: {new Date(request.requestedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600 mb-2">
                          Teams: {tournament.teams.length}/{tournament.maxTeams}
                        </p>
                        {tournament.teams.length >= tournament.maxTeams && (
                          <p className="text-xs text-red-600 font-semibold">Tournament Full</p>
                        )}
                      </div>
                    </div>

                    {rejectingIndex === idx ? (
                      <div className="space-y-3">
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Reason for rejection..."
                          rows="3"
                          className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (rejectionReason.trim()) {
                                rejectMutation.mutate({ requestIndex: idx, reason: rejectionReason });
                              }
                            }}
                            disabled={!rejectionReason.trim() || rejectMutation.isPending}
                            className="flex-1 px-4 py-2 rounded bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-75"
                          >
                            {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                          </button>
                          <button
                            onClick={() => {
                              setRejectingIndex(null);
                              setRejectionReason('');
                            }}
                            className="flex-1 px-4 py-2 rounded bg-gray-300 text-gray-900 text-sm font-semibold hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveMutation.mutate(idx)}
                          disabled={approveMutation.isPending || tournament.teams.length >= tournament.maxTeams}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-75 disabled:cursor-not-allowed transition"
                        >
                          <FiCheck size={16} />
                          {approveMutation.isPending ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => setRejectingIndex(idx)}
                          disabled={rejectMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded bg-gray-300 text-gray-900 text-sm font-semibold hover:bg-gray-400 disabled:opacity-75 transition"
                        >
                          <FiX size={16} />
                          Reject
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Approved Requests */}
        {approvedRequests.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
            <h2 className="text-xl font-display font-bold text-gray-900 mb-6">
              Approved ({approvedRequests.length})
            </h2>
            <div className="space-y-3">
              {approvedRequests.map(request => (
                <div key={request._id} className="p-4 border border-green-200 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{request.teamName}</h3>
                      <p className="text-sm text-gray-600">Captain: {request.captain.name}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                      <FiCheck size={12} />
                      Approved
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rejected Requests */}
        {rejectedRequests.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-xl font-display font-bold text-gray-900 mb-6">
              Rejected ({rejectedRequests.length})
            </h2>
            <div className="space-y-3">
              {rejectedRequests.map(request => (
                <div key={request._id} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">{request.teamName}</h3>
                    <p className="text-sm text-gray-600">Captain: {request.captain.name}</p>
                    {request.rejectionReason && (
                      <p className="text-sm text-red-700 mt-2">Reason: {request.rejectionReason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Requests */}
        {requests.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <p className="text-gray-600">No team requests yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
