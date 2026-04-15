import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { FiMapPin, FiStar, FiClock, FiCheck, FiArrowLeft } from 'react-icons/fi';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function VenueDetail() {
  const { id } = useParams();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: venue, isLoading } = useQuery({
    queryKey: ['venue', id],
    queryFn: async () => {
      const { data } = await api.get(`/venues/${id}`);
      return data.data.venue;
    },
  });

  const { data: slots } = useQuery({
    queryKey: ['venue-slots', id, selectedDate],
    queryFn: async () => {
      const { data } = await api.get(`/venues/${id}/slots?date=${selectedDate}`);
      return data.data.courts;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-64 bg-gray-100 rounded-2xl mb-6" />
        <div className="h-8 bg-gray-100 rounded-lg w-1/2 mb-4" />
        <div className="h-5 bg-gray-100 rounded-lg w-1/3" />
      </div>
    );
  }

  if (!venue) {
    return <div className="text-center py-20 text-gray-500">Venue not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <Link to="/venues" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
        <FiArrowLeft size={16} /> Back to venues
      </Link>

      {/* Image */}
      <div className="h-64 md:h-80 bg-gray-100 rounded-2xl overflow-hidden mb-6 shadow-soft">
        {venue.images?.[0] ? (
          <img src={venue.images[0]} alt={venue.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <FiMapPin size={64} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">{venue.name}</h1>
          <p className="text-gray-500 flex items-center gap-1 mt-2">
            <FiMapPin size={16} />
            {[venue.address?.area, venue.address?.city].filter(Boolean).join(', ')}
          </p>
        </div>
        {venue.rating > 0 && (
          <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl ring-1 ring-amber-100">
            <FiStar size={16} fill="currentColor" />
            <span className="font-semibold">{venue.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {venue.description && (
        <p className="text-gray-600 mb-6 leading-relaxed">{venue.description}</p>
      )}

      {/* Amenities */}
      {venue.amenities?.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {venue.amenities.map((a) => (
              <span key={a} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg text-sm text-gray-700">
                <FiCheck size={14} className="text-accent-500" /> {a.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Slot Booking */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Book a Slot</h2>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="input w-auto"
          />
        </div>

        {slots?.map((court) => (
          <div key={court._id} className="mb-6">
            <h3 className="font-medium text-gray-800 mb-3">{court.name}</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {court.slots?.map((slot) => (
                <button
                  key={slot.index}
                  disabled={!slot.isAvailable}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    slot.isAvailable
                      ? 'bg-gray-50 hover:bg-primary-600 text-gray-700 hover:text-white border border-gray-200 hover:border-primary-500 hover:shadow-sm'
                      : 'bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                  }`}
                >
                  <div className="flex items-center gap-1 justify-center">
                    <FiClock size={12} />
                    {slot.startTime}
                  </div>
                  <div className="text-[10px] mt-0.5">₹{slot.price}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
