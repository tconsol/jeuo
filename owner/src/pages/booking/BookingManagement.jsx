import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../../services';
import { DataTable, StatusBadge } from '../../components';

export default function BookingManagement() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['owner-bookings', filter],
    queryFn: () => bookingService.getAll({ status: filter === 'all' ? undefined : filter }).then((r) => r.data.data),
  });

  const approve = useMutation({
    mutationFn: (id) => bookingService.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owner-bookings'] }),
  });

  const reject = useMutation({
    mutationFn: (id) => bookingService.reject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owner-bookings'] }),
  });

  const columns = [
    { key: 'user', label: 'Customer', render: (_, row) => row.user?.name || '—' },
    { key: 'venue', label: 'Venue', render: (_, row) => row.venue?.name || '—' },
    { key: 'date', label: 'Date', render: (v) => new Date(v).toLocaleDateString('en-IN') },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'actions', label: '', render: (_, row) => row.status === 'pending' && (
      <div className="flex gap-2">
        <button onClick={(e) => { e.stopPropagation(); approve.mutate(row._id); }} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Approve</button>
        <button onClick={(e) => { e.stopPropagation(); reject.mutate(row._id); }} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">Reject</button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Bookings</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg">
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      {isLoading ? <div className="animate-pulse h-60 bg-gray-100 rounded-xl" /> : <DataTable columns={columns} data={bookings} />}
    </div>
  );
}
