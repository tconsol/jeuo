import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../lib/api';
import { connectMatchSocket, disconnectMatchSocket } from '../lib/socket';
import { setLiveScore, addEvent, setEvents, setConnected, resetMatch } from '../store/slices/matchSlice';

import CricketScoreboard from '../components/scoring/CricketScoreboard';
import FootballScoreboard from '../components/scoring/FootballScoreboard';
import BasketballScoreboard from '../components/scoring/BasketballScoreboard';
import TennisScoreboard from '../components/scoring/TennisScoreboard';
import RacketScoreboard from '../components/scoring/RacketScoreboard';
import VolleyballScoreboard from '../components/scoring/VolleyballScoreboard';

const SCOREBOARD_MAP = {
  cricket: CricketScoreboard,
  football: FootballScoreboard,
  basketball: BasketballScoreboard,
  tennis: TennisScoreboard,
  badminton: RacketScoreboard,
  table_tennis: RacketScoreboard,
  volleyball: VolleyballScoreboard,
};

export default function MatchDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { liveScore, isConnected } = useSelector((s) => s.match);

  const { data: match, isLoading } = useQuery({
    queryKey: ['match', id],
    queryFn: async () => {
      const { data } = await api.get(`/scoring/${id}`);
      return data.data;
    },
  });

  // Set score from initial fetch
  useEffect(() => {
    if (match?.score) {
      dispatch(setLiveScore({ score: match.score, scoreVersion: match.scoreVersion }));
    }
  }, [match, dispatch]);

  // Connect to live socket
  useEffect(() => {
    if (!id || match?.status !== 'live') return;

    const token = localStorage.getItem('accessToken');
    const socket = connectMatchSocket(token);

    socket.on('connect', () => {
      dispatch(setConnected(true));
      socket.emit('join:match', id);
    });

    socket.on('disconnect', () => dispatch(setConnected(false)));

    socket.on('score:update', (data) => {
      dispatch(setLiveScore({ score: data.score, scoreVersion: data.scoreVersion }));
      if (data.event) dispatch(addEvent(data.event));
    });

    socket.on('match:status', (data) => {
      // Force refetch
      if (data.status === 'completed') {
        window.location.reload();
      }
    });

    return () => {
      socket.emit('leave:match', id);
      disconnectMatchSocket();
      dispatch(resetMatch());
    };
  }, [id, match?.status, dispatch]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-card animate-pulse">
          <div className="h-32 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!match) return <div className="text-center py-20 text-gray-500">Match not found</div>;

  const score = liveScore || match.score;
  const ScoreboardComponent = SCOREBOARD_MAP[match.sport];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Status bar */}
      <div className="flex items-center justify-between mb-6">
        <span className={`badge ${
          match.status === 'live' ? 'badge-live' :
          match.status === 'upcoming' ? 'badge-upcoming' : 'badge-completed'
        }`}>
          {match.status === 'live' && <span className="w-2 h-2 bg-red-500 rounded-full mr-1.5 animate-pulse" />}
          {match.status.toUpperCase()}
        </span>
        {isConnected && match.status === 'live' && (
          <span className="flex items-center gap-1.5 text-xs text-accent-600 font-medium">
            <span className="w-2 h-2 bg-accent-500 rounded-full animate-pulse" /> Live
          </span>
        )}
      </div>

      {/* Sport-specific scoreboard */}
      {ScoreboardComponent && score ? (
        <ScoreboardComponent score={score} match={match} />
      ) : (
        <div className="card text-center py-12 text-gray-400">
          No score data available
        </div>
      )}
    </div>
  );
}
