import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import api from '../lib/api';
import { FiMapPin, FiStar, FiClock, FiCheck, FiArrowLeft, FiPhone, FiGlobe, FiUsers, FiCalendar, FiInfo } from 'react-icons/fi';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const SLOT_COLORS = {
  available: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 cursor-pointer',
  booked: 'bg-red-50 border-red-200 text-red-300 cursor-not-allowed line-through opacity-60',
  locked: 'bg-amber-50 border-amber-200 text-amber-600 cursor-not-allowed',
  unavailable: 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed',
  selected: 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-300',
};

const SLOT_LABELS = {
  available: 'Available',
  booked: 'Booked',
  locked: 'On Hold',
  unavailable: 'N/A',
};

const AMENITY_ICONS = {
  parking: '\u{1F17F}\uFE0F', washroom: '\u{1F6BB}', changing_room: '\u{1F6AA}', drinking_water: '\u{1F4A7}',
  floodlight: '\u{1F4A1}', first_aid: '\u{1FA79}', cafeteria: '\u2615', wifi: '\u{1F4F6}',
  scoreboard: '\u{1F4CA}', coaching: '\u{1F393}', equipment: '\u{1F3CB}\uFE0F', shower: '\u{1F6BF}',
};

function getNext7Days() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      date: d.toISOString().split('T')[0],
      day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      num: d.getDate(),
      month: d.toLocaleDateString('en-IN', { month: 'short' }),
      isToday: i === 0,
    });
  }
  return days;
}

export default function VenueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const auth = useSelector((state) => state.auth);
  const isLoggedIn = !!auth?.user || !!localStorage.getItem('accessToken');

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [bookingStep, setBookingStep] = useState('select');
  const [isBooking, setIsBooking] = useState(false);

  const dates = useMemo(() => getNext7Days(), []);

  const { data: venue, isLoading } = useQuery({
    queryKey: ['venue', id],
    queryFn: async () => {
      const { data } = await api.get(`/venues/${id}`);
      return data.data.venue || data.data;
    },
  });

  const { data: courts, isLoading: slotsLoading, refetch: refetchSlots } = useQuery({
    queryKey: ['venue-slots', id, selectedDate],
    queryFn: async () => {
      const { data } = await api.get(`/venues/${id}/slots?date=${selectedDate}`);
      return data.data.courts || data.data || [];
    },
    enabled: !!id,
  });

  const activeCourt = selectedCourt ?? courts?.[0]?.courtNumber ?? 1;
  const activeCourtData = courts?.find(c => c.courtNumber === activeCourt);

  const toggleSlot = (slot) => {
    if (slot.status !== 'available') return;
    setSelectedSlots(prev => {
      const exists = prev.find(s => s.startTime === slot.startTime && s.index === slot.index);
      if (exists) return prev.filter(s => !(s.startTime === slot.startTime && s.index === slot.index));
      return [...prev, slot];
    });
  };

  const totalPrice = selectedSlots.reduce((sum, s) => sum + (s.price || 0), 0);

  const handleBook = async () => {
    if (!isLoggedIn) {
      toast.error('Please login to book a slot');
      navigate('/login');
      return;
    }
    if (selectedSlots.length === 0) return;

    setIsBooking(true);
    try {
      for (const slot of selectedSlots) {
        const lockRes = await api.post('/bookings/lock', {
          venueId: id,
          date: selectedDate,
          slot: { startTime: slot.startTime, endTime: slot.endTime },
          court: activeCourt,
        });
        const { booking, lockToken } = lockRes.data.data;
        await api.post('/bookings/confirm', {
          bookingId: booking._id,
          lockToken,
          paymentId: `pay_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        });
      }
      toast.success(`${selectedSlots.length} slot${selectedSlots.length > 1 ? 's' : ''} booked successfully!`);
      setBookingStep('success');
      setSelectedSlots([]);
      refetchSlots();
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Slot may no longer be available.');
      refetchSlots();
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-6 w-24 bg-gray-200 rounded-lg mb-4" />
          <div className="h-72 bg-gray-100 rounded-2xl mb-6" />
          <div className="h-8 bg-gray-100 rounded-lg w-1/2 mb-3" />
          <div className="h-5 bg-gray-100 rounded-lg w-1/3 mb-6" />
          <div className="grid grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FiMapPin size={28} className="text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Venue not found</h3>
        <Link to="/venues" className="text-primary-600 text-sm mt-2 inline-block">Browse venues</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Link to="/venues" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
        <FiArrowLeft size={16} /> Back to venues
      </Link>

      <div className="relative h-64 md:h-80 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl overflow-hidden mb-6 shadow-sm">
        {venue.images?.[0] ? (
          <img src={venue.images[0]} alt={venue.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-7xl opacity-20">{'\u{1F3DF}\uFE0F'}</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">{venue.name}</h1>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="text-white/80 text-sm flex items-center gap-1">
              <FiMapPin size={14} />
              {[venue.location?.address, venue.location?.city].filter(Boolean).join(', ')}
            </span>
            {venue.rating > 0 && (
              <span className="flex items-center gap-1 bg-amber-400/90 text-amber-900 px-2 py-0.5 rounded-full text-xs font-semibold">
                <FiStar size={11} fill="currentColor" /> {venue.rating.toFixed(1)}
              </span>
            )}
            {venue.sports?.map(s => (
              <span key={s} className="bg-white/20 backdrop-blur-sm text-white text-xs px-2.5 py-0.5 rounded-full capitalize">{s}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-wrap gap-3">
            {venue.openTime && venue.closeTime && (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm text-gray-600">
                <FiClock size={14} className="text-gray-400" />
                {venue.openTime} - {venue.closeTime}
              </div>
            )}
            {venue.contactPhone && (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm text-gray-600">
                <FiPhone size={14} className="text-gray-400" />
                {venue.contactPhone}
              </div>
            )}
            {venue.courtCount && (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm text-gray-600">
                <FiUsers size={14} className="text-gray-400" />
                {venue.courtCount} Court{venue.courtCount > 1 ? 's' : ''}
              </div>
            )}
            {venue.surfaceType && (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm text-gray-600">
                <FiInfo size={14} className="text-gray-400" />
                {venue.surfaceType} {venue.isIndoor ? '(Indoor)' : '(Outdoor)'}
              </div>
            )}
          </div>

          {venue.description && (
            <p className="text-gray-600 leading-relaxed text-sm">{venue.description}</p>
          )}

          {venue.amenities?.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {venue.amenities.map((a, i) => (
                  <span key={`amenity-${i}`} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm text-gray-700 shadow-sm">
                    <span>{AMENITY_ICONS[a] || '\u2713'}</span>
                    <span className="capitalize">{a.replace(/[_-]/g, ' ')}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-50/50 to-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FiCalendar className="text-primary-500" /> Book a Slot
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Select date, court, and time slots</p>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                    <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" /> Available
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                    <span className="w-3 h-3 rounded bg-red-100 border border-red-300" /> Booked
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                    <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" /> On Hold
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                    <span className="w-3 h-3 rounded bg-blue-600 border border-blue-600" /> Selected
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Select Date</label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {dates.map((d) => (
                    <button
                      key={d.date}
                      onClick={() => { setSelectedDate(d.date); setSelectedSlots([]); }}
                      className={`flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-xl border-2 transition-all duration-200 min-w-[72px] ${
                        selectedDate === d.date
                          ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-[10px] font-medium uppercase">{d.day}</span>
                      <span className="text-lg font-bold leading-tight">{d.num}</span>
                      <span className="text-[10px]">{d.month}</span>
                      {d.isToday && <span className="text-[9px] font-semibold text-primary-500 mt-0.5">Today</span>}
                    </button>
                  ))}
                </div>
              </div>

              {courts && courts.length > 1 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Select Court</label>
                  <div className="flex gap-2 flex-wrap">
                    {courts.map((court) => (
                      <button
                        key={court.courtNumber}
                        onClick={() => { setSelectedCourt(court.courtNumber); setSelectedSlots([]); }}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
                          activeCourt === court.courtNumber
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {court.name || `Court ${court.courtNumber}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex sm:hidden items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" /> Available
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <span className="w-3 h-3 rounded bg-red-100 border border-red-300" /> Booked
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" /> On Hold
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <span className="w-3 h-3 rounded bg-blue-600 border border-blue-600" /> Selected
                </span>
              </div>

              {slotsLoading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="h-[68px] bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : activeCourtData?.slots?.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                  {activeCourtData.slots.map((slot) => {
                    const isSelected = selectedSlots.some(s => s.startTime === slot.startTime && s.index === slot.index);
                    const status = isSelected ? 'selected' : (slot.status || (slot.isAvailable ? 'available' : 'booked'));

                    return (
                      <motion.button
                        key={`${slot.startTime}-${slot.index}`}
                        whileTap={status === 'available' || isSelected ? { scale: 0.95 } : {}}
                        onClick={() => toggleSlot(slot)}
                        disabled={status !== 'available' && !isSelected}
                        className={`relative flex flex-col items-center justify-center px-2 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${SLOT_COLORS[status]}`}
                        title={SLOT_LABELS[slot.status] || slot.status}
                      >
                        <div className="flex items-center gap-1">
                          <FiClock size={12} />
                          <span className="font-semibold">{slot.startTime}</span>
                        </div>
                        {slot.endTime && (
                          <span className="text-[10px] opacity-70 mt-0.5">to {slot.endTime}</span>
                        )}
                        <span className={`text-[11px] mt-1 font-medium ${isSelected ? 'text-white/90' : ''}`}>
                          {status === 'booked' ? 'Booked' : status === 'locked' ? 'On Hold' : `\u20B9${slot.price || 0}`}
                        </span>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md"
                          >
                            <FiCheck size={12} className="text-blue-600" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-400">
                  <FiCalendar size={32} className="mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No slots available for this date</p>
                  <p className="text-xs mt-1">Try selecting a different date or court</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-4">
            <AnimatePresence>
              {selectedSlots.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
                >
                  <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
                    <h3 className="text-white font-semibold text-sm">Booking Summary</h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Venue</span>
                        <span className="font-medium text-gray-900 text-right">{venue.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Date</span>
                        <span className="font-medium text-gray-900">
                          {new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Court</span>
                        <span className="font-medium text-gray-900">Court {activeCourt}</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-3 space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Selected Slots</p>
                      {selectedSlots.map((slot) => (
                        <div key={`${slot.startTime}-${slot.index}`} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FiClock size={12} className="text-blue-500" />
                            <span className="text-sm font-medium text-blue-800">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-blue-700">{'\u20B9'}{slot.price || 0}</span>
                            <button onClick={() => toggleSlot(slot)} className="text-blue-400 hover:text-red-500 transition-colors">{'\u2715'}</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-100 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Total</span>
                        <span className="text-xl font-bold text-gray-900">{'\u20B9'}{totalPrice.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {bookingStep === 'success' ? (
                      <div className="text-center py-3">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <FiCheck size={24} className="text-emerald-600" />
                        </div>
                        <p className="font-semibold text-emerald-700">Booking Confirmed!</p>
                        <Link to="/bookings" className="text-sm text-primary-600 hover:underline mt-1 inline-block">
                          View My Bookings {'\u2192'}
                        </Link>
                      </div>
                    ) : (
                      <button
                        onClick={handleBook}
                        disabled={isBooking}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isBooking ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Booking...
                          </>
                        ) : (
                          <>Book Now {'\u00B7'} {'\u20B9'}{totalPrice.toLocaleString('en-IN')}</>
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Venue Details</h3>
              {venue.location?.address && (
                <div className="flex gap-2 text-sm">
                  <FiMapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">{venue.location.address}</span>
                </div>
              )}
              {venue.contactPhone && (
                <div className="flex gap-2 text-sm">
                  <FiPhone size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <a href={`tel:${venue.contactPhone}`} className="text-primary-600 hover:underline">{venue.contactPhone}</a>
                </div>
              )}
              {venue.website && (
                <div className="flex gap-2 text-sm">
                  <FiGlobe size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <a href={venue.website} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline truncate">{venue.website}</a>
                </div>
              )}
              {venue.cancellationPolicy && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  <p className="font-semibold mb-0.5">Cancellation: {venue.cancellationPolicy}</p>
                  {venue.cancellationPolicy === 'flexible' && <p>Full refund if cancelled 2+ hours before</p>}
                  {venue.cancellationPolicy === 'moderate' && <p>Full refund if cancelled 24+ hours before</p>}
                  {venue.cancellationPolicy === 'strict' && <p>50% refund if cancelled 48+ hours before</p>}
                </div>
              )}
            </div>

            {selectedSlots.length === 0 && (
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-6 text-center">
                <FiCalendar size={24} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium text-gray-600">Select time slots to book</p>
                <p className="text-xs text-gray-400 mt-1">Click on green slots to select them</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
