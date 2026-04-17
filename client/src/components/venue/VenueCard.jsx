import { Link } from 'react-router-dom';
import Badge from '../common/Badge';
import { formatCurrency, getVenueImageUrl } from '../../utils';

export default function VenueCard({ venue }) {
  const image = getVenueImageUrl(venue);

  return (
    <Link to={`/venues/${venue._id}`} className="block bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="h-40 bg-gray-100">
        <img src={image} alt={venue.name} className="h-full w-full object-cover" loading="lazy" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-gray-900 line-clamp-1">{venue.name}</h3>
          {venue.rating && (
            <span className="flex items-center gap-1 text-sm text-yellow-600 font-medium">⭐ {venue.rating.toFixed(1)}</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{venue.location?.city || venue.location?.address || 'Location'}</p>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {venue.sports?.slice(0, 3).map((s) => <Badge key={s} variant="primary">{s}</Badge>)}
        </div>
        <p className="mt-3 text-sm font-medium text-indigo-600">From {formatCurrency(venue.minPrice || 0)}/hr</p>
      </div>
    </Link>
  );
}
