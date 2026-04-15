import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import api from '../lib/api';

export default function VenueApprovals() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-pending-venues'],
    queryFn: () => api.get('/admin/venues/pending').then((r) => r.data),
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
      <h1 className="text-2xl font-bold text-gray-900">Venue Approvals</h1>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="card animate-pulse h-40" />)}
        </div>
      ) : venues.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">✅</p>
          <p>No pending venue approvals</p>
        </div>
      ) : (
        <div className="space-y-4">
          {venues.map((v, i) => (
            <motion.div key={v._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">{v.name}</h3>
                  <p className="text-sm text-gray-500">
                    {v.address?.line1}, {v.address?.city}, {v.address?.state} — {v.address?.pincode}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Owner: {v.owner?.name || 'Unknown'} · {v.owner?.phone || ''}
                  </p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {v.sports?.map((s) => (
                      <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">{s}</span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {v.courts?.length || 0} courts · {v.amenities?.length || 0} amenities
                  </p>
                  {v.description && (
                    <p className="text-sm text-gray-600 mt-3 border-t border-gray-100 pt-3">{v.description}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <button onClick={() => approveMut.mutate(v._id)} disabled={approveMut.isPending}
                    className="btn-success text-sm disabled:opacity-50">Approve</button>
                  <button onClick={() => rejectMut.mutate(v._id)} disabled={rejectMut.isPending}
                    className="btn-danger text-sm disabled:opacity-50">Reject</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
