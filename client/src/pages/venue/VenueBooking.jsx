import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { venueService, bookingService } from '../../services';
import { SlotGrid, AmenityBadge } from '../../components/venue';
import { LoadingSpinner, Badge } from '../../components/common';
import { PaymentModal } from '../../components/payment';

export default function VenueBooking() {
  const { id } = useParams();
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  const { data: venue, isLoading } = useQuery({
    queryKey: ['venue', id],
    queryFn: () => venueService.getById(id).then((r) => r.data.data),
  });

  const { data: slots } = useQuery({
    queryKey: ['slots', id, selectedCourt, date],
    queryFn: () => venueService.getSlots(id, selectedCourt, date).then((r) => r.data.data),
    enabled: !!selectedCourt && !!date,
  });

  if (isLoading) return <LoadingSpinner className="py-20" />;

  const handleBook = async ({ method }) => {
    await bookingService.create({ venue: id, court: selectedCourt, slot: selectedSlot._id, date, paymentMethod: method });
    setShowPayment(false);
    setSelectedSlot(null);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Book at {venue?.name}</h1>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Select Court</label>
        <div className="flex gap-2 flex-wrap">
          {venue?.courts?.map((c) => (
            <button key={c._id} onClick={() => { setSelectedCourt(c._id); setSelectedSlot(null); }}
              className={`px-4 py-2 rounded-lg text-sm border ${selectedCourt === c._id ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200'}`}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {selectedCourt && (
        <>
          <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setSelectedSlot(null); }}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm" min={new Date().toISOString().split('T')[0]} />
          <SlotGrid slots={slots} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />
        </>
      )}

      {selectedSlot && (
        <button onClick={() => setShowPayment(true)} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">
          Proceed to Pay
        </button>
      )}

      <PaymentModal isOpen={showPayment} onClose={() => setShowPayment(false)} amount={selectedSlot?.price || 0} booking={{ venue: id, slot: selectedSlot }} onPay={handleBook} />
    </div>
  );
}
