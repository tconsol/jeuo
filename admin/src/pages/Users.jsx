import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function Users() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, page],
    queryFn: () => api.get('/admin/users', { params: { search, page, limit: 20 } }).then((r) => r.data),
  });

  const toggleMut = useMutation({
    mutationFn: (userId) => api.patch(`/admin/users/${userId}/toggle-active`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User updated');
    },
  });

  const users = data?.users || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500">{total} total</p>
      </div>

      <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search users by name, email, or phone…" className="input max-w-md" />

      <div className="card overflow-hidden !p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 text-xs uppercase border-b border-gray-200 bg-gray-50">
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Roles</th>
              <th className="py-3 px-4">Joined</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">No users found</td></tr>
            ) : users.map((u) => (
              <tr key={u._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
                      {u.name?.[0] || '?'}
                    </div>
                    <span className="text-gray-900">{u.name || 'Unnamed'}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-500">
                  <p>{u.phone}</p>
                  {u.email && <p className="text-xs">{u.email}</p>}
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-1">
                    {u.roles?.map((r) => (
                      <span key={r} className={`text-xs px-1.5 py-0.5 rounded ${
                        r === 'admin' ? 'bg-purple-100 text-purple-700' :
                        r === 'owner' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{r}</span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-500 text-xs">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                </td>
                <td className="py-3 px-4">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    u.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>{u.isActive !== false ? 'Active' : 'Disabled'}</span>
                </td>
                <td className="py-3 px-4">
                  <button onClick={() => toggleMut.mutate(u._id)} disabled={toggleMut.isPending}
                    className={`text-xs ${u.isActive !== false ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'} disabled:opacity-50`}>
                    {u.isActive !== false ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="btn-ghost text-sm disabled:opacity-30">← Prev</button>
          <span className="px-3 py-2 text-sm text-gray-400">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="btn-ghost text-sm disabled:opacity-30">Next →</button>
        </div>
      )}
    </div>
  );
}
