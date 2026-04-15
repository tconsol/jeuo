import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { FiArrowLeft } from 'react-icons/fi';

export default function ActivityDetail() {
  const { id } = useParams();
  const { data: activity, isLoading } = useQuery({
    queryKey: ['activity', id],
    queryFn: async () => {
      const { data } = await api.get(`/activities/${id}`);
      return data.data.activity;
    },
  });

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse"><div className="h-8 bg-gray-100 rounded-lg w-1/2 mb-4" /></div>;
  if (!activity) return <div className="text-center py-20 text-gray-500">Activity not found</div>;

  const approvedPlayers = activity.players?.filter(p => p.status === 'approved') || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/activities" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
        <FiArrowLeft size={16} /> Back to games
      </Link>

      <h1 className="text-3xl font-display font-bold text-gray-900">{activity.title}</h1>
      <div className="flex flex-wrap gap-2 mt-4">
        <span className="badge bg-primary-50 text-primary-600 ring-1 ring-primary-100">{activity.sport}</span>
        <span className="badge bg-gray-100 text-gray-600">
          {new Date(activity.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <span className="badge bg-gray-100 text-gray-600">{activity.time}</span>
      </div>

      {activity.venue && (
        <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100 mt-6">
          <h2 className="font-semibold text-gray-900 mb-2">Venue</h2>
          <p className="text-gray-600">{activity.venue.name}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100 mt-4">
        <h2 className="font-semibold text-gray-900 mb-4">Players ({approvedPlayers.length}/{activity.maxPlayers})</h2>
        <div className="space-y-3">
          {approvedPlayers.map((p) => (
            <div key={p.user._id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-sm font-semibold text-white">
                {p.user.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-medium text-gray-900">{p.user.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
