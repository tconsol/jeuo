import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services';
import { DataTable, StatusBadge } from '../../components';
import { useDebounce } from '../../hooks';

export default function UserManagement() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', debounced],
    queryFn: () => userService.getAll({ q: debounced }).then((r) => r.data.data),
  });

  const ban = useMutation({ mutationFn: (id) => userService.ban(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }) });
  const unban = useMutation({ mutationFn: (id) => userService.unban(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }) });

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'role', label: 'Role', render: (v) => <span className="capitalize">{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'actions', label: '', render: (_, row) => (
      <button
        onClick={(e) => { e.stopPropagation(); row.status === 'banned' ? unban.mutate(row._id) : ban.mutate(row._id); }}
        className={`text-xs px-2 py-1 rounded ${row.status === 'banned' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
      >
        {row.status === 'banned' ? 'Unban' : 'Ban'}
      </button>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Users</h1>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…"
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg w-64"
        />
      </div>
      {isLoading ? <div className="animate-pulse h-60 bg-gray-100 rounded-xl" /> : <DataTable columns={columns} data={data?.users || data} />}
    </div>
  );
}
