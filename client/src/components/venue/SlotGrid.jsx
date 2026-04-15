import { formatCurrency, formatTime } from '../../utils';

export default function SlotGrid({ slots, selectedSlot, onSelect }) {
  if (!slots?.length) return <p className="text-sm text-gray-400 py-4">No slots available for this date.</p>;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((slot) => {
        const isSelected = selectedSlot?._id === slot._id;
        const isBooked = slot.status === 'booked';

        return (
          <button
            key={slot._id}
            onClick={() => !isBooked && onSelect(slot)}
            disabled={isBooked}
            className={`p-3 rounded-lg border text-center text-sm transition-colors ${
              isBooked
                ? 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
                : isSelected
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-400'
            }`}
          >
            <div className="font-medium">{formatTime(slot.startTime)}</div>
            <div className="text-xs mt-0.5">{isBooked ? 'Booked' : formatCurrency(slot.price)}</div>
          </button>
        );
      })}
    </div>
  );
}
