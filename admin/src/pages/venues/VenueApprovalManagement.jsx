import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { venueService } from '../../services';
import { DataTable, StatusBadge } from '../../components';

export default function VenueApprovalManagement() {
  const qc = useQueryClient();

  const { data: venues, isLoading } = useQuery({
    queryKey: ['admin-venues-pending'],
    queryFn: () => venueService.getPending().then((r) => r.data.data),
  });

  const approve = useMutation({
    mutationFn: (id) => venueService.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-venues-pending'] }),
  });

  const reject = useMutation({
    mutationFn: (id) => venueService.reject(id, 'Does not meet requirements'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-venues-pending'] }),
  });

  const columns = [
    { key: 'name', label: 'Venue Name' },
    { key: 'owner', label: 'Owner', render: (_, row) => row.owner?.name || ' ' },
    { key: 'city', label: 'City', render: (_, row) => row.address?.city || ' ' },
    { key: 'sports', label: 'Sports', render: (v) => v?.join(', ') || ' ' },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'actions', label: '', render: (_, row) => (
      <div className="flex gap-2">
        <button onClick={(e) => { e.stopPropagation(); approve.mutate(row._id); }} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Approve</button>
        <button onClick={(e) => { e.stopPropagation(); reject.mutate(row._id); }} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">Reject</button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Venue Approvals</h1>
      {isLoading ? <div className="animate-pulse h-60 bg-gray-100 rounded-xl" /> : <DataTable columns={columns} data={venues} />}
    </div>
  );
}
