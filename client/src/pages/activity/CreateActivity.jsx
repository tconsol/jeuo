import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { activityService } from '../../services';

export default function CreateActivity() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', sport: 'cricket', date: '', startTime: '', venue: '', maxPlayers: 10, skillLevel: 'intermediate' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await activityService.create(form);
      navigate(`/activities/${data.data._id}`);
    } finally {
      setLoading(false);
    }
  };

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Create Activity</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input placeholder="Activity Title" value={form.title} onChange={(e) => update('title', e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" required />
        <select value={form.sport} onChange={(e) => update('sport', e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm">
          {['cricket', 'football', 'basketball', 'tennis', 'badminton', 'volleyball'].map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} className="px-4 py-3 border border-gray-200 rounded-xl text-sm" required />
          <input type="time" value={form.startTime} onChange={(e) => update('startTime', e.target.value)} className="px-4 py-3 border border-gray-200 rounded-xl text-sm" required />
        </div>
        <input type="number" placeholder="Max Players" value={form.maxPlayers} onChange={(e) => update('maxPlayers', +e.target.value)} min={2} max={30} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
        <select value={form.skillLevel} onChange={(e) => update('skillLevel', e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm">
          {['beginner', 'intermediate', 'advanced', 'pro'].map((l) => (
            <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
          ))}
        </select>
        <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50">
          {loading ? 'Creating…' : 'Create Activity'}
        </button>
      </form>
    </div>
  );
}
