import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { tournamentService } from '../../services/tournament.service';
import { useSelector } from 'react-redux';
import { FiArrowLeft, FiCheck, FiX, FiAlertCircle, FiUsers, FiClock, FiChevronDown } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function TournamentRequests() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const queryClient = useQueryClient();
  const [rejectingIndex, setRejectingIndex] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const { data: tournament, isLoading } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => tournamentService.getById(tournamentId).then((r) => r.data.data.tournament),
  });

  const { data: requests = [] } = useQuery({
    queryKey: ['tournament-requests', tournamentId],
    queryFn: () => tournamentService.getTeamRequests(tournamentId).then((r) => r.data.data.teamRequests),
  });

  const approveMutation = useMutation({
    mutationFn: (requestIndex) => tournamentService.approveTeamRequest(tournamentId, requestIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament-requests', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
      toast.success('Team approved!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ requestIndex, reason }) =>
      tournamentService.rejectTeamRequest(tournamentId, requestIndex, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament-requests', tournamentId] });
      setRejectingIndex(null);
      setRejectionReason('');
      toast.success('Request rejected');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to reject'),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    );
  }

  if (tournament?.creator?._id !== user?._id && tournament?.creator !== user?._id) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <FiAlertCircle size={28} className="text-red-500" />
        </div>
        <p className="text-red-600 font-medium">You don't have permission to view this page</p>
        <button onClick={() => navigate(-1)}
          className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm transition">
          ← Go back
        </button>
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const resolvedRequests = requests.filter((r) => r.status !== 'pending');
  const isFull = (tournament?.teams?.length || 0) >= (tournament?.maxTeams || 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 pb-24">

      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition font-medium">
        <FiArrowLeft size={15} /> Back
      </button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Team Requests</h1>
        {tournament && (
          <p className="text-gray-400 text-sm mt-0.5">{tournament.name}</p>
        )}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-xl">
            <FiUsers size={12} />
            {tournament?.teams?.length || 0}/{tournament?.maxTeams} teams
          </div>
          {pendingRequests.length > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-xl">
              <FiClock size={12} />
              {pendingRequests.length} pending
            </div>
          )}
          {isFull && (
            <div className="text-xs font-bold bg-red-50 text-red-600 px-3 py-1.5 rounded-xl">
              Tournament Full
            </div>
          )}
        </div>
      </div>

      {/* Pending */}
      {pendingRequests.length === 0 && resolvedRequests.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <FiUsers size={24} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">No team requests yet</p>
          <p className="text-gray-400 text-xs mt-1">Requests from teams wanting to join will appear here</p>
        </div>
      )}

      {pendingRequests.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Pending ({pendingRequests.length})
          </h2>
          <div className="space-y-3">
            <AnimatePresence>
              {pendingRequests.map((request, idx) => (
                <motion.div
                  key={request._id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <h3 className="font-black text-gray-900 text-base">{request.teamName}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Captain: <span className="font-semibold text-gray-700">{request.captain?.name || request.captain}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(request.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <span className="flex-shrink-0 text-[11px] bg-amber-50 text-amber-600 font-bold px-2.5 py-1 rounded-full">
                        Pending
                      </span>
                    </div>

                    <AnimatePresence mode="wait">
                      {rejectingIndex === idx ? (
                        <motion.div key="reject-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="space-y-3">
                          <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Reason for rejection (required)…"
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (rejectionReason.trim()) {
                                  rejectMutation.mutate({ requestIndex: idx, reason: rejectionReason });
                                }
                              }}
                              disabled={!rejectionReason.trim() || rejectMutation.isPending}
                              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition disabled:opacity-60">
                              {rejectMutation.isPending ? 'Rejecting…' : 'Confirm Reject'}
                            </button>
                            <button
                              onClick={() => { setRejectingIndex(null); setRejectionReason(''); }}
                              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition">
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div key="action-btns" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="flex gap-2">
                          <button
                            onClick={() => approveMutation.mutate(idx)}
                            disabled={approveMutation.isPending || isFull}
                            title={isFull ? 'Tournament is full' : undefined}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed">
                            <FiCheck size={14} />
                            {approveMutation.isPending ? 'Approving…' : 'Approve'}
                          </button>
                          <button
                            onClick={() => setRejectingIndex(idx)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition">
                            <FiX size={14} />
                            Reject
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* History (approved + rejected) */}
      {resolvedRequests.length > 0 && (
        <section>
          <button onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 hover:text-gray-600 transition">
            History ({resolvedRequests.length})
            <FiChevronDown size={13} className={`transition-transform ${showHistory ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-2">
                {resolvedRequests.map((request, idx) => (
                  <div key={request._id || idx}
                    className={`bg-white rounded-2xl border shadow-sm p-4 flex items-start gap-3 ${
                      request.status === 'approved' ? 'border-emerald-100' : 'border-red-100'
                    }`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      request.status === 'approved' ? 'bg-emerald-50' : 'bg-red-50'
                    }`}>
                      {request.status === 'approved'
                        ? <FiCheck size={14} className="text-emerald-600" />
                        : <FiX size={14} className="text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">{request.teamName}</p>
                      <p className="text-xs text-gray-400">Captain: {request.captain?.name || request.captain}</p>
                      {request.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1">Reason: {request.rejectionReason}</p>
                      )}
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                      request.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {request.status === 'approved' ? 'Approved' : 'Rejected'}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}
    </div>
  );
}
