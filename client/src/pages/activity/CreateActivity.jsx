import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUsers, FiCalendar, FiClock } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SportIcon } from '../../utils/sportIcons';
import { CustomSelect } from '../../components/common';
import { activityService } from '../../services';

const SPORTS = [
  { value: 'cricket',    label: 'Cricket',    icon: <SportIcon sport="cricket" size={16} /> },
  { value: 'football',   label: 'Football',   icon: <SportIcon sport="football" size={16} /> },
  { value: 'basketball', label: 'Basketball', icon: <SportIcon sport="basketball" size={16} /> },
  { value: 'tennis',     label: 'Tennis',     icon: <SportIcon sport="tennis" size={16} /> },
  { value: 'badminton',  label: 'Badminton',  icon: <SportIcon sport="badminton" size={16} /> },
  { value: 'volleyball', label: 'Volleyball', icon: <SportIcon sport="volleyball" size={16} /> },
];

const SKILL_LEVELS = [
  { value: 'any',          label: 'Any Level' },
  { value: 'beginner',     label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced',     label: 'Advanced' },
];

export default function CreateActivity() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', sport: 'cricket', date: '', startTime: '', description: '', maxPlayers: 10, skillLevel: 'any' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await activityService.create(form);
      navigate(`/activities/${data.data?._id || data.data?.activity?._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create activity');
    } finally {
      setLoading(false);
    }
  };

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto px-4 py-8 pb-28">
      <Link to="/activities" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
        <FiArrowLeft size={16} /> Back to games
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5">
          <h1 className="text-xl font-bold text-white">Create Activity</h1>
          <p className="text-indigo-200 text-sm mt-1">Set up a game and invite players</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Activity Title</label>
            <input
              placeholder="e.g. Weekend Cricket Match"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition"
              required
            />
          </div>

          {/* Sport */}
          <CustomSelect
            label="Sport"
            value={form.sport}
            onChange={(v) => update('sport', v)}
            options={SPORTS}
            placeholder="Select a sport"
          />

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <FiCalendar size={13} className="inline mr-1" />Date
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => update('date', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <FiClock size={13} className="inline mr-1" />Start Time
              </label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => update('startTime', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition"
                required
              />
            </div>
          </div>

          {/* Max Players */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <FiUsers size={13} className="inline mr-1" />Max Players
            </label>
            <input
              type="number"
              placeholder="10"
              value={form.maxPlayers}
              onChange={(e) => update('maxPlayers', +e.target.value)}
              min={2}
              max={30}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition"
            />
          </div>

          {/* Skill Level */}
          <CustomSelect
            label="Skill Level"
            value={form.skillLevel}
            onChange={(v) => update('skillLevel', v)}
            options={SKILL_LEVELS}
            placeholder="Select skill level"
          />

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (optional)</label>
            <textarea
              placeholder="Add any details about the game, rules, or what to bring..."
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition active:scale-[0.98]"
          >
            {loading ? 'Creating…' : 'Create Activity'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
