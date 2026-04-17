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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Venues</h1>
          <p className="text-sm text-gray-400 mt-0.5">{venues.length} venues</p>
        </div>
        <Link to="/venues/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-xl shadow-sm transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Venue
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2].map((i) => <div key={i} className="bg-white rounded-2xl border border-gray-200/60 animate-pulse h-36" />)}
        </div>
      ) : venues.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">No venues yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first venue to start receiving bookings</p>
          <Link to="/venues/new" className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-xl shadow-sm transition">Add Your First Venue</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {venues.map((v, i) => (
            <motion.div key={v._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} className="bg-white rounded-2xl border border-gray-200/60 p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{v.name}</h3>
                      <p className="text-sm text-gray-400">{v.location?.city}, {v.location?.state}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {v.sports?.map((s) => (
                      <span key={s} className="text-[11px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg capitalize font-medium">{s}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{v.courts?.length || 0} courts</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>{v.amenities?.length || 0} amenities</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 ml-4">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                    v.isApproved ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${v.isApproved ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {v.isApproved ? 'Approved' : 'Pending'}
                  </span>
                  <Link to={`/venues/${v._id}/edit`} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition">
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
