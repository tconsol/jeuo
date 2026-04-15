import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export default function AuditLogs() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page],
    queryFn: () => api.get('/admin/audit-logs', { params: { page, limit: 30 } }).then((r) => r.data),
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 30);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500">{total} entries</p>
      </div>

      <div className="card overflow-hidden !p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 text-xs uppercase border-b border-gray-200 bg-gray-50">
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Resource</th>
              <th className="py-3 px-4">Details</th>
              <th className="py-3 px-4">Time</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Loading…</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">No audit logs</td></tr>
            ) : logs.map((log) => (
              <tr key={log._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="py-3 px-4">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    log.action?.includes('create') ? 'bg-green-100 text-green-700' :
                    log.action?.includes('delete') ? 'bg-red-100 text-red-700' :
                    log.action?.includes('update') ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{log.action}</span>
                </td>
                <td className="py-3 px-4 text-gray-600">{log.user?.name || log.userId || '—'}</td>
                <td className="py-3 px-4 text-gray-500">
                  <span className="capitalize">{log.resourceType}</span>
                  {log.resourceId && <span className="text-xs text-gray-400 ml-1">({log.resourceId.slice(-6)})</span>}
                </td>
                <td className="py-3 px-4 text-xs text-gray-400 max-w-xs truncate">
                  {log.details ? JSON.stringify(log.details).slice(0, 80) : '—'}
                </td>
                <td className="py-3 px-4 text-xs text-gray-400">
                  {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
