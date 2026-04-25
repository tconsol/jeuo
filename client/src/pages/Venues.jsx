import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { SportIcon } from '../utils/sportIcons';
import api from '../lib/api';
import { FiMapPin, FiStar, FiSearch, FiFilter } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { getVenueImageUrl } from '../utils';

const SPORTS = [
  { id: 'all',        label: 'All Sports' },
  { id: 'cricket',    label: 'Cricket'    },
  { id: 'football',   label: 'Football'   },
  { id: 'basketball', label: 'Basketball' },
  { id: 'tennis',     label: 'Tennis'     },
  { id: 'badminton',  label: 'Badminton'  },
  { id: 'volleyball', label: 'Volleyball' },
];

export default function Venues() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSport, setSelectedSport] = useState(searchParams.get('sport') || 'all');
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['venues', selectedSport],
    queryFn: () => {
      const params = {};
      if (selectedSport !== 'all') params.sport = selectedSport;
      return api.get('/venues', { params }).then((r) => r.data.data?.venues || []);
    },
  });

  const handleSportChange = (sport) => {
    setSelectedSport(sport);
    const newParams = new URLSearchParams(searchParams);
    if (sport === 'all') newParams.delete('sport');
    else newParams.set('sport', sport);
    setSearchParams(newParams);
  };

  const venues = (data || []).filter((v) =>
    !search ||
    v.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.location?.address?.toLowerCase().includes(search.toLowerCase()) ||
    v.location?.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-5 pb-24">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Venues</h1>
        <p className="text-gray-400 text-xs mt-0.5">
          {venues.length} venue{venues.length !== 1 ? 's' : ''} · book your next game
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search venues, areas, cities…"
          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm"
        />
      </div>

      {/* Sport pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        {SPORTS.map((sport) => (
          <button key={sport.id} onClick={() => handleSportChange(sport.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              selectedSport === sport.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
            }`}>
            {sport.id !== 'all' && (
              <SportIcon sport={sport.id} size={12} className={selectedSport === sport.id ? 'text-white' : 'text-gray-400'} />
            )}
            {sport.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-5">
          Failed to load venues. Please try again.
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
              <div className="h-44 bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded-lg w-2/3" />
                <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid */}
      {!isLoading && venues.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {venues.map((venue, i) => (
            <motion.div key={venue._id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}>
              <Link to={`/venues/${venue._id}`}
                className="block bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group active:scale-[0.99]">

                {/* Image */}
                <div className="h-44 bg-gradient-to-br from-indigo-50 to-purple-50 overflow-hidden relative">
                  <img
                    src={getVenueImageUrl(venue)}
                    alt={venue.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  {venue.sports?.length > 0 && (
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      {venue.sports.slice(0, 2).map((s) => (
                        <span key={s} className="flex items-center gap-1 bg-white/90 backdrop-blur-sm text-gray-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <SportIcon sport={s} size={10} /> {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {venue.rating > 0 && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-black">
                      <FiStar size={9} fill="currentColor" /> {venue.rating.toFixed(1)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors text-sm truncate mb-1">
                    {venue.name}
                  </h3>
                  <p className="text-gray-400 text-xs flex items-center gap-1 mb-3">
                    <FiMapPin size={11} className="flex-shrink-0" />
                    <span className="truncate">{venue.location?.city || venue.location?.address || 'Location'}</span>
                  </p>
                  <div className="flex items-center justify-between">
                    {venue.priceRange ? (
                      <p className="text-sm font-black text-indigo-600">
                        ₹{venue.priceRange.min}<span className="text-gray-400 font-normal text-xs">/hr</span>
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                      {venue.courtCount ? `${venue.courtCount} court${venue.courtCount > 1 ? 's' : ''}` : 'Book now'}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && venues.length === 0 && !error && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <FiMapPin size={28} className="text-gray-200" />
          </div>
          <p className="text-sm font-bold text-gray-600">No venues found</p>
          <p className="text-xs text-gray-400 mt-1">
            {search ? `No results for "${search}". Try a different search.` : 'Try a different sport filter.'}
          </p>
        </div>
      )}
    </div>
  );
}
