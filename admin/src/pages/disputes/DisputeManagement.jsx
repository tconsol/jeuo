import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { disputeService } from '../../services';
import { DataTable, StatusBadge } from '../../components';

export default function DisputeManagement() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('open');

  const { data: disputes, isLoading } = useQuery({
    queryKey: ['disputes', filter],
    queryFn: () => disputeService.getAll({ status: filter }).then((r) => r.data.data),
  });

  const resolve = useMutation({
    mutationFn: ({ id, resolution }) => disputeService.resolve(id, resolution),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disputes'] }),
  });

  const columns = [
    { key: 'type', label: 'Type', render: (v) => <span className="capitalize">{v}</span> },
    { key: 'user', label: 'Reported By', render: (_, row) => row.user?.name || ' ' },
    { key: 'description', label: 'Issue', render: (v) => <span className="line-clamp-1">{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'createdAt', label: 'Date', render: (v) => new Date(v).toLocaleDateString('en-IN') },
    { key: 'actions', label: '', render: (_, row) => row.status === 'open' && (
      <div className="flex gap-2">
        <button onClick={(e) => { e.stopPropagation(); resolve.mutate({ id: row._id, resolution: { action: 'refund', note: 'Resolved with refund' } }); }}
          className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Refund</button>
        <button onClick={(e) => { e.stopPropagation(); resolve.mutate({ id: row._id, resolution: { action: 'dismiss', note: 'Dismissed' } }); }}
          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">Dismiss</button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Disputes</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg">
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="all">All</option>
        </select>
      </div>
      {isLoading ? <div className="animate-pulse h-60 bg-gray-100 rounded-xl" /> : <DataTable columns={columns} data={disputes} />}
    </div>
  );
}
