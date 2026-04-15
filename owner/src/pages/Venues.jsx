import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../lib/api';

export default function Venues() {
  const { data, isLoading } = useQuery({
    queryKey: ['owner-venues'],
    queryFn: () => api.get('/venues/owner/my-venues').then((r) => r.data),
  });

  const venues = data?.data?.venues || data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Venues</h1>
        <Link to="/venues/new" className="btn-primary text-sm">+ Add Venue</Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2].map((i) => <div key={i} className="card animate-pulse h-32" />)}
        </div>
      ) : venues.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🏟️</p>
          <p>No venues added yet</p>
          <Link to="/venues/new" className="btn-primary inline-block mt-4 text-sm">Add Your First Venue</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {venues.map((v, i) => (
            <motion.div key={v._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{v.name}</h3>
                  <p className="text-sm text-gray-500">{v.address?.city}, {v.address?.state}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {v.sports?.map((s) => (
                      <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">{s}</span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{v.courts?.length || 0} courts · {v.amenities?.length || 0} amenities</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    v.isApproved ? 'bg-green-100 text-green-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{v.isApproved ? 'approved' : 'pending'}</span>
                  <Link to={`/venues/${v._id}/edit`} className="text-xs text-primary-600 hover:text-primary-700">
                    Edit
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
