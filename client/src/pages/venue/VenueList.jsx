import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { venueService } from '../../services';
import { VenueCard } from '../../components/venue';
import { SearchInput, LoadingSpinner, EmptyState } from '../../components/common';
import { useGeolocation } from '../../hooks';

export default function VenueList() {
  const [search, setSearch] = useState('');
  const { position } = useGeolocation();

  const { data, isLoading } = useQuery({
    queryKey: ['venues', search, position?.lat, position?.lng],
    queryFn: () =>
      search
        ? venueService.search(search).then((r) => r.data.data)
        : position
          ? venueService.getNearby(position.lat, position.lng, 10).then((r) => r.data.data)
          : venueService.getAll().then((r) => r.data.data),
  });

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Venues</h1>
      <SearchInput value={search} onChange={setSearch} placeholder="Search venues…" />
      {isLoading ? (
        <LoadingSpinner className="py-20" />
      ) : !data?.length ? (
        <EmptyState icon="<FiGrid size={18} className="inline" />️" title="No venues found" description="Try a different search or location." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{data.map((v) => <VenueCard key={v._id} venue={v} />)}</div>
      )}
    </div>
  );
}
