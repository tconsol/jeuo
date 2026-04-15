import { Link } from 'react-router-dom';
import Badge from '../common/Badge';
import { sportIcon, formatDate, formatTime } from '../../utils';

export default function ActivityCard({ activity }) {
  const spotsLeft = activity.maxPlayers - (activity.players?.length || 0);
  const isFull = spotsLeft <= 0;

  return (
    <Link to={`/activities/${activity._id}`} className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{sportIcon(activity.sport)}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{activity.title}</h3>
            <p className="text-xs text-gray-500">{activity.venue?.name}</p>
          </div>
        </div>
        <Badge variant={isFull ? 'danger' : 'success'}>{isFull ? 'Full' : `${spotsLeft} spots`}</Badge>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
        <span>{formatDate(activity.date)}</span>
        <span>{formatTime(activity.startTime)}</span>
        <span className="capitalize">{activity.skillLevel}</span>
      </div>
    </Link>
  );
}
