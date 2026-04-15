import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { FiMapPin, FiStar, FiFilter } from 'react-icons/fi';
import { motion } from 'framer-motion';

const SPORTS = ['all', 'cricket', 'football', 'basketball', 'tennis', 'badminton', 'volleyball'];

export default function Venues() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSport, setSelectedSport] = useState(searchParams.get('sport') || 'all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['venues', selectedSport],
    queryFn: async () => {
      const params = {};
      if (selectedSport !== 'all') params.sport = selectedSport;
      const { data } = await api.get('/venues', { params });
      return data.data;
    },
  });
  const handleSportChange = (sport) => {
    setSelectedSport(sport);
    if (sport === 'all') searchParams.delete('sport');
    else searchParams.set('sport', sport);
    setSearchParams(searchParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Venues</h1>
          <p className="text-gray-500 mt-1">Find the perfect place to play</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-gray-300 hover:shadow-sm transition-all">
          <FiFilter size={16} /> Filters
        </button>
      </div>

      {/* Sport filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {SPORTS.map((sport) => (
          <button
            key={sport}
            onClick={() => handleSportChange(sport)}
            className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedSport === sport
                ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/25'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
            }`}
          >
            {sport.charAt(0).toUpperCase() + sport.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          Error loading venues: {error.message}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-card animate-pulse">
              <div className="h-48 bg-gray-100" />
              <div className="p-5">
                <div className="h-5 bg-gray-100 rounded-lg w-2/3 mb-3" />
                <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.venues?.map((venue, i) => (
            <motion.div
              key={venue._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/venues/${venue._id}`} className="block bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 group border border-gray-100">
                <div className="h-48 bg-gray-100 overflow-hidden">
                  {venue.images?.[0] ? (
                    <img src={venue.images[0]} alt={venue.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <FiMapPin size={48} />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary-600 transition-colors">{venue.name}</h3>
                      <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                        <FiMapPin size={14} /> {venue.address?.area || venue.address?.city}
                      </p>
                    </div>
                    {venue.rating > 0 && (
                      <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-lg">
                        <FiStar size={13} fill="currentColor" />
                        <span className="text-sm font-semibold">{venue.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="badge bg-primary-50 text-primary-600 ring-1 ring-primary-100">{venue.sport}</span>
                    {venue.priceRange && (
                      <span className="text-sm text-gray-500 font-medium">₹{venue.priceRange.min}+</span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {data?.venues?.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiMapPin size={28} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">No venues found</h3>
          <p className="text-gray-500 mt-2">Try changing the sport filter or expanding your search area.</p>
        </div>
      )}
    </div>
  );
}
