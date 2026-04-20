import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { SportIcon } from '../utils/sportIcons';
import api from '../lib/api';
import { FiMapPin, FiStar, FiSearch } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { getVenueImageUrl } from '../utils';

const SPORTS = [
  { id: 'all',        label: 'All Sports' },
  { id: 'cricket',    label: 'Cricket' },
  { id: 'football',   label: 'Football' },
  { id: 'basketball', label: 'Basketball' },
  { id: 'tennis',     label: 'Tennis' },
  { id: 'badminton',  label: 'Badminton' },
  { id: 'volleyball', label: 'Volleyball' },
];

export default function Venues() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSport, setSelectedSport] = useState(searchParams.get('sport') || 'all');
  const [search, setSearch] = useState('');

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
    const newParams = new URLSearchParams(searchParams);
    if (sport === 'all') newParams.delete('sport');
    else newParams.set('sport', sport);
    setSearchParams(newParams);
  };

  const venues = (data?.venues || []).filter((v) =>
    !search || v.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.location?.address?.toLowerCase().includes(search.toLowerCase()) ||
    v.location?.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900">Venues</h1>
        <p className="text-gray-500 mt-1">Discover the perfect place to play near you</p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search venues or areas…"
            className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white shadow-sm"
          />
        </div>
      </div>

      {/* Sport filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
        {SPORTS.map((sport) => (
          <button
            key={sport.id}
            onClick={() => handleSportChange(sport.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedSport === sport.id
                ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/25'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
            }`}
          >
            {sport.id !== 'all' && <SportIcon sport={sport.id} size={14} />}
            {sport.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-6">
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
          {venues.map((venue, i) => (
            <motion.div
              key={venue._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link to={`/venues/${venue._id}`} className="block bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 group border border-gray-100">
                <div className="h-48 bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden relative">
                  <img src={getVenueImageUrl(venue)} alt={venue.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {venue.sport && (
                    <span className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-gray-700 px-2.5 py-1 rounded-full text-xs font-medium">
                      <SportIcon sport={venue.sport} size={12} /> {venue.sport}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 mr-3">
                      <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary-600 transition-colors truncate">{venue.name}</h3>
                      <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                        <FiMapPin size={13} className="flex-shrink-0" />
                        <span className="truncate">{venue.location?.city || venue.location?.address || 'Location'}</span>
                      </p>
                    </div>
                    {venue.rating > 0 && (
                      <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-lg flex-shrink-0">
                        <FiStar size={12} fill="currentColor" />
                        <span className="text-xs font-semibold">{venue.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  {venue.priceRange && (
                    <p className="text-sm text-primary-600 font-medium mt-3">From ₹{venue.priceRange.min}<span className="text-gray-400 font-normal">/hr</span></p>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && venues.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiMapPin size={28} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">No venues found</h3>
          <p className="text-gray-500 mt-2">{search ? `No results for "${search}". Try a different search.` : 'Try changing the sport filter.'}</p>
        </div>
      )}
    </div>
  );
}

