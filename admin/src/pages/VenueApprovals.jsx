import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import api from '../lib/api';

export default function VenueApprovals() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-pending-venues'],
    queryFn: () => api.get('/admin/venues/pending').then((r) => r.data.data),
  });

  const approveMut = useMutation({
    mutationFn: (id) => api.patch(`/admin/venues/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-venues'] });
      toast.success('Venue approved');
    },
  });

  const rejectMut = useMutation({
    mutationFn: (id) => api.patch(`/admin/venues/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-venues'] });
      toast.success('Venue rejected');
    },
  });

  const venues = data?.venues || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Venue Approvals</h1>
        <p className="text-sm text-gray-400 mt-0.5">{venues.length} pending</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="bg-white rounded-2xl border border-gray-200/60 animate-pulse h-40" />)}
        </div>
      ) : venues.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">All caught up!</p>
          <p className="text-sm text-gray-400 mt-1">No pending venue approvals</p>
        </div>
      ) : (
        <div className="space-y-4">
          {venues.map((v, i) => (
            <motion.div key={v._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} className="bg-white rounded-2xl border border-gray-200/60 p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-gray-900">{v.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {v.location?.address}, {v.location?.city}, {v.location?.state}   {v.location?.pincode}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {v.owner?.name || 'Unknown'} · {v.owner?.phone || ''}
                    </span>
                    <span>{v.courts?.length || 0} courts</span>
                    <span>{v.amenities?.length || 0} amenities</span>
                  </div>
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {v.sports?.map((s) => (
                      <span key={s} className="text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg capitalize font-medium">{s}</span>
                    ))}
                  </div>
                  {v.description && (
                    <p className="text-sm text-gray-500 mt-3 border-t border-gray-100 pt-3 line-clamp-2">{v.description}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 ml-6">
                  <button onClick={() => approveMut.mutate(v._id)} disabled={approveMut.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-sm disabled:opacity-50 transition">Approve</button>
                  <button onClick={() => rejectMut.mutate(v._id)} disabled={rejectMut.isPending}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl disabled:opacity-50 transition">Reject</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
