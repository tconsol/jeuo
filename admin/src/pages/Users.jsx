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
    queryFn: () => api.get('/admin/users', { params: { search, page, limit: 20 } }).then((r) => r.data.data),
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} registered users</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search users by name, email, or phone…"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wider border-b border-gray-100">
              <th className="py-3.5 px-5 font-medium">User</th>
              <th className="py-3.5 px-5 font-medium">Contact</th>
              <th className="py-3.5 px-5 font-medium">Role</th>
              <th className="py-3.5 px-5 font-medium">Joined</th>
              <th className="py-3.5 px-5 font-medium">Status</th>
              <th className="py-3.5 px-5 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> Loading…</div>
              </td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No users found</td></tr>
            ) : users.map((u) => (
              <tr key={u._id} className="hover:bg-gray-50/50 transition">
                <td className="py-3.5 px-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                      {u.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="font-medium text-gray-900">{u.name || 'Unnamed'}</span>
                  </div>
                </td>
                <td className="py-3.5 px-5">
                  <p className="text-gray-600">{u.phone}</p>
                  {u.email && <p className="text-xs text-gray-400">{u.email}</p>}
                </td>
                <td className="py-3.5 px-5">
                  <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                    u.role === 'admin' ? 'bg-purple-50 text-purple-600' :
                    u.role === 'owner' ? 'bg-blue-50 text-blue-600' :
                    'bg-gray-50 text-gray-500'
                  }`}>{u.role || 'player'}</span>
                </td>
                <td className="py-3.5 px-5 text-gray-400 text-xs">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ' '}
                </td>
                <td className="py-3.5 px-5">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                    u.isActive !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {u.isActive !== false ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="py-3.5 px-5">
                  <button onClick={() => toggleMut.mutate(u._id)} disabled={toggleMut.isPending}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                      u.isActive !== false
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-emerald-600 hover:bg-emerald-50'
                    } disabled:opacity-50`}>
                    {u.isActive !== false ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 transition">← Prev</button>
          <span className="text-sm text-gray-400">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 transition">Next →</button>
        </div>
      )}
    </div>
  );
}
