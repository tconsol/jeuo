import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { activityService } from '../../services';
import { ActivityCard } from '../../components/activity';
import { SearchInput, LoadingSpinner, EmptyState } from '../../components/common';

export default function ActivityList() {
  const [search, setSearch] = useState('');
  const [sport, setSport] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['activities', search, sport],
    queryFn: () => activityService.getAll({ q: search, sport, limit: 20 }).then((r) => r.data.data),
  });

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Activities</h1>
      <SearchInput value={search} onChange={setSearch} placeholder="Search activities…" />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['', 'cricket', 'football', 'basketball', 'tennis', 'badminton', 'volleyball'].map((s) => (
          <button
            key={s}
            onClick={() => setSport(s)}
            className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap ${sport === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-20" />
      ) : !data?.length ? (
        <EmptyState icon="🏃" title="No activities" description="No activities found. Create one!" />
      ) : (
        <div className="space-y-3">{data.map((a) => <ActivityCard key={a._id} activity={a} />)}</div>
      )}
    </div>
  );
}
