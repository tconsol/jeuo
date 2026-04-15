import { Link } from 'react-router-dom';
import Badge from '../common/Badge';
import { sportIcon, formatDate } from '../../utils';

export default function TournamentCard({ tournament }) {
  const statusColors = {
    upcoming: 'info', registration: 'primary', 'in-progress': 'warning', completed: 'success', cancelled: 'danger',
  };

  return (
    <Link to={`/tournaments/${tournament._id}`} className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{sportIcon(tournament.sport)}</span>
          <h3 className="font-semibold text-gray-900">{tournament.name}</h3>
        </div>
        <Badge variant={statusColors[tournament.status] || 'default'}>{tournament.status}</Badge>
      </div>
      <p className="text-xs text-gray-500 mb-3">{tournament.venue?.name}</p>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>{formatDate(tournament.startDate)}</span>
        <span className="capitalize">{tournament.format}</span>
        <span>{tournament.teams?.length || 0}/{tournament.maxTeams} teams</span>
      </div>
    </Link>
  );
}
