const amenityIcons = {
  parking: '🅿️', washroom: '🚻', 'changing-room': '🚪', drinking_water: '💧',
  floodlight: '💡', first_aid: '🩹', cafeteria: '☕', wifi: '📶',
  scoreboard: '📊', coaching: '🎓', equipment: '🏋️', shower: '🚿',
};

export default function AmenityBadge({ amenity }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-lg text-xs text-gray-600">
      <span>{amenityIcons[amenity] || '✓'}</span>
      <span className="capitalize">{amenity.replace(/[_-]/g, ' ')}</span>
    </span>
  );
}
