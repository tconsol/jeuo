import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CustomSelect } from '../../components/common';
import { disputeService } from '../../services';

const STATUS_COLORS = {
  open: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  escalated: 'bg-purple-100 text-purple-800',
};

const TYPES = ['score_dispute', 'player_conduct', 'rule_violation', 'technical_issue', 'other'];

const TYPE_OPTIONS = TYPES.map(t => ({ value: t, label: t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }));

export default function Disputes() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ matchId: '', type: 'score_dispute', title: '', description: '' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['myDisputes'],
    queryFn: () => disputeService.getMyDisputes(),
  });

  const createMutation = useMutation({
    mutationFn: () => disputeService.create(form.matchId, { type: form.type, title: form.title, description: form.description }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myDisputes'] });
      setShowForm(false);
      setForm({ matchId: '', type: 'score_dispute', title: '', description: '' });
    },
  });

  const disputes = data?.data?.data?.disputes || data?.data?.disputes || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Disputes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Raise Dispute'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6 space-y-4">
          <input
            placeholder="Match ID"
            value={form.matchId}
            onChange={(e) => setForm({ ...form, matchId: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition"
          />
          <CustomSelect
            label="Dispute Type"
            value={form.type}
            onChange={(v) => setForm({ ...form, type: v })}
            options={TYPE_OPTIONS}
            placeholder="Select type"
          />
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition"
          />
          <textarea
            placeholder="Describe the issue..."
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition"
          />
          <button
            disabled={!form.matchId || !form.title || createMutation.isPending}
            onClick={() => createMutation.mutate()}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium disabled:opacity-40"
          >
            {createMutation.isPending ? 'Submitting...' : 'Submit'}
          </button>
          {createMutation.isError && (
            <p className="text-red-500 text-sm">{createMutation.error?.message || 'Failed to submit'}</p>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : disputes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No disputes raised yet</div>
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => (
            <div key={d._id} className="bg-white rounded-xl border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{d.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 capitalize">{d.type?.replace(/_/g, ' ')}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[d.status] || 'bg-gray-100 text-gray-600'}`}>
                  {d.status?.replace(/_/g, ' ')}
                </span>
              </div>
              {d.description && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{d.description}</p>
              )}
              {d.resolution?.decision && (
                <div className="mt-2 p-2 bg-green-50 rounded-lg text-sm text-green-700">
                  Resolution: {d.resolution.decision}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
