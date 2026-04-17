import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

const ACTION_STYLES = {
  create: 'bg-emerald-50 text-emerald-600',
  approve: 'bg-emerald-50 text-emerald-600',
  delete: 'bg-red-50 text-red-600',
  reject: 'bg-red-50 text-red-600',
  ban: 'bg-red-50 text-red-600',
  update: 'bg-blue-50 text-blue-600',
  unban: 'bg-amber-50 text-amber-600',
};

function actionStyle(action) {
  const key = Object.keys(ACTION_STYLES).find((k) => action?.includes(k));
  return ACTION_STYLES[key] || 'bg-gray-50 text-gray-500';
}

export default function AuditLogs() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page],
    queryFn: () => api.get('/admin/audit-logs', { params: { page, limit: 30 } }).then((r) => r.data.data),
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 30);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} entries</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wider border-b border-gray-100">
              <th className="py-3.5 px-5 font-medium">Action</th>
              <th className="py-3.5 px-5 font-medium">User</th>
              <th className="py-3.5 px-5 font-medium">Resource</th>
              <th className="py-3.5 px-5 font-medium">Details</th>
              <th className="py-3.5 px-5 font-medium">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">
                <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> Loading…</div>
              </td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">No audit logs</td></tr>
            ) : logs.map((log) => (
              <tr key={log._id} className="hover:bg-gray-50/50 transition">
                <td className="py-3.5 px-5">
                  <span className={`text-[11px] font-medium px-2.5 py-1 rounded-lg ${actionStyle(log.action)}`}>{log.action}</span>
                </td>
                <td className="py-3.5 px-5 text-gray-600">{log.actor?.name || ' '}</td>
                <td className="py-3.5 px-5 text-gray-500">
                  <span className="capitalize">{log.resource?.type || ' '}</span>
                  {log.resource?.id && <span className="text-xs text-gray-400 ml-1">({String(log.resource.id).slice(-6)})</span>}
                </td>
                <td className="py-3.5 px-5 text-xs text-gray-400 max-w-xs truncate">
                  {log.details ? JSON.stringify(log.details).slice(0, 80) : ' '}
                </td>
                <td className="py-3.5 px-5 text-xs text-gray-400 whitespace-nowrap">
                  {log.createdAt ? new Date(log.createdAt).toLocaleString() : ' '}
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
