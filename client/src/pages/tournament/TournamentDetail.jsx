import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tournamentService } from '../../services';
import { FixturesBracket, PointsTable } from '../../components/tournament';
import { LoadingSpinner, Badge } from '../../components/common';
import { sportIcon, formatDate } from '../../utils';
import { useState } from 'react';

export default function TournamentDetail() {
  const { id } = useParams();
  const [tab, setTab] = useState('fixtures');

  const { data: tournament, isLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentService.getById(id).then((r) => r.data.data),
  });

  const { data: fixtures } = useQuery({
    queryKey: ['tournament-fixtures', id],
    queryFn: () => tournamentService.getFixtures(id).then((r) => r.data.data),
    enabled: tab === 'fixtures',
  });

  const { data: standings } = useQuery({
    queryKey: ['tournament-standings', id],
    queryFn: () => tournamentService.getStandings(id).then((r) => r.data.data),
    enabled: tab === 'standings',
  });

  if (isLoading) return <LoadingSpinner className="py-20" />;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start gap-3">
        <span className="text-3xl">{sportIcon(tournament.sport)}</span>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{tournament.name}</h1>
          <p className="text-sm text-gray-500">
            {tournament.startDate ? formatDate(tournament.startDate) : 'TBD'}
            {' — '}
            {tournament.endDate ? formatDate(tournament.endDate) : 'TBD'}
          </p>
        </div>
        <Badge variant="primary" className="ml-auto">{tournament.status}</Badge>
      </div>

      <div className="flex border-b border-gray-200">
        {['fixtures', 'standings'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 capitalize ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'fixtures' && <FixturesBracket fixtures={fixtures} />}
      {tab === 'standings' && <PointsTable standings={standings} />}
    </div>
  );
}
