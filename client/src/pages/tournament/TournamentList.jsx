import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tournamentService } from '../../services';
import { TournamentCard } from '../../components/tournament';
import { SearchInput, LoadingSpinner, EmptyState } from '../../components/common';

export default function TournamentList() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['tournaments', search],
    queryFn: () => tournamentService.getAll({ q: search }).then((r) => r.data.data),
  });

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Tournaments</h1>
      <SearchInput value={search} onChange={setSearch} placeholder="Search tournaments…" />
      {isLoading ? (
        <LoadingSpinner className="py-20" />
      ) : !data?.length ? (
        <EmptyState icon="<FiAward size={18} className="inline" />" title="No tournaments" description="Tournaments will appear here." />
      ) : (
        <div className="space-y-3">{data.map((t) => <TournamentCard key={t._id} tournament={t} />)}</div>
      )}
    </div>
  );
}
