import { useParams, useNavigate } from 'react-router-dom';
import { SportIcon } from '../utils/sportIcons';
import { FiMapPin, FiClock, FiTarget, FiBarChart2 } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
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

const SPORT_GRADIENT = {
  cricket:      'from-emerald-600 via-emerald-700 to-teal-700',
  football:     'from-green-600 via-green-700 to-emerald-700',
  basketball:   'from-orange-500 via-orange-600 to-amber-600',
  tennis:       'from-lime-500 via-lime-600 to-green-600',
  badminton:    'from-blue-600 via-blue-700 to-indigo-700',
  volleyball:   'from-yellow-500 via-yellow-600 to-amber-600',
  table_tennis: 'from-red-500 via-red-600 to-rose-600',
};

export default function MatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { liveScore, isConnected } = useSelector((s) => s.match);

  const { data: matchData, isLoading } = useQuery({
    queryKey: ['match', id],
    queryFn: async () => {
      const { data } = await api.get(`/scoring/${id}`);
      return data.data;
    },
  });

  const match = matchData?.match;
  const initialScore = matchData?.score;

  // Set score from initial fetch
  useEffect(() => {
    if (initialScore) {
      dispatch(setLiveScore({ score: initialScore, scoreVersion: match?.scoringVersion }));
    }
  }, [initialScore, match, dispatch]);

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
        <div className="space-y-4">
          <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-6">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <SportIcon sport="cricket" size={40} />
        </div>
        <p className="text-gray-500 font-medium">Match not found</p>
        <button onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition text-sm font-medium">
          ← Go Back
        </button>
      </div>
    );
  }

  const score = liveScore || initialScore;
  const ScoreboardComponent = SCOREBOARD_MAP[match.sport];
  const sportGradient = SPORT_GRADIENT[match.sport] || SPORT_GRADIENT.cricket;
  const homeTeam = match.teams?.home;
  const awayTeam = match.teams?.away;
  const homeScore = score?.home?.goals ?? score?.currentInningsData?.runs ?? 0;
  const awayScore = score?.away?.goals ?? score?.innings?.[0]?.runs ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-4 py-6 pb-20 space-y-5"
    >
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
      >
        ← Back
      </button>

      {/* Hero header */}
      <div className={`bg-gradient-to-br ${sportGradient} rounded-3xl p-8 text-white shadow-lg`}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="mb-2"><SportIcon sport={match.sport} size={52} className="text-white/90" /></div>
            <h1 className="text-3xl font-bold capitalize">{match.sport?.replace('_', ' ')}</h1>
            <p className="text-white/60 text-sm mt-1">Match Details</p>
          </div>
          <div className="text-right">
            {match.status === 'live' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-red-500 text-white px-3 py-1.5 rounded-full animate-pulse">
                <span className="w-2 h-2 bg-white rounded-full" />
                LIVE NOW
              </span>
            )}
            {match.status === 'scheduled' && (
              <span className="inline-block text-xs font-bold bg-white/15 text-white px-3 py-1.5 rounded-full">
                SCHEDULED
              </span>
            )}
            {match.status === 'completed' && (
              <span className="inline-block text-xs font-bold bg-white/15 text-white px-3 py-1.5 rounded-full">
                COMPLETED
              </span>
            )}
          </div>
        </div>

        {/* Score display */}
        <div className="flex items-center justify-center gap-8 my-8">
          <div className="text-center">
            <p className="text-white/60 text-xs uppercase tracking-widest mb-2">Home</p>
            <p className="text-5xl font-extrabold tabular-nums">{homeScore}</p>
            <p className="text-sm text-white/70 mt-1">{homeTeam?.name || 'Team A'}</p>
          </div>
          <div className="text-3xl text-white/40">–</div>
          <div className="text-center">
            <p className="text-white/60 text-xs uppercase tracking-widest mb-2">Away</p>
            <p className="text-5xl font-extrabold tabular-nums">{awayScore}</p>
            <p className="text-sm text-white/70 mt-1">{awayTeam?.name || 'Team B'}</p>
          </div>
        </div>

        {/* Match info */}
        <div className="space-y-2 text-sm text-white/80">
          {match.venue && (
            <p className="flex items-center gap-2 font-medium"><FiMapPin size={14} /> {match.venue.name}</p>
          )}
          {match.scheduledAt && (
            <p className="flex items-center gap-2"><FiClock size={14} /> {new Date(match.scheduledAt).toLocaleString('en-IN', { 
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}</p>
          )}
          {match.format && (
            <p className="flex items-center gap-2"><FiTarget size={14} /> {typeof match.format === 'object' ? (match.format.overs ? `${match.format.overs} overs${match.format.innings ? `, ${match.format.innings} innings` : ''}` : '-') : match.format}</p>
          )}
        </div>
      </div>

      {/* Scoreboard */}
      {ScoreboardComponent && score ? (
        <ScoreboardComponent score={score} match={match} />
      ) : (
        match.status !== 'scheduled' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-400">
            No score data available
          </div>
        )
      )}

      {/* Match info cards */}
      <div className="grid grid-cols-2 gap-3">
        {match.venue && (
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 shadow-sm p-4 ring-1 ring-blue-50">
            <p className="text-xs text-blue-500 uppercase tracking-widest font-bold mb-2 flex items-center gap-1"><FiMapPin size={12} /> Venue</p>
            <p className="font-semibold text-gray-900">{match.venue.name}</p>
            {match.venue.location?.address && (
              <p className="text-xs text-gray-500 mt-1">{match.venue.location.address}</p>
            )}
            {match.venue.location?.city && (
              <p className="text-xs text-gray-400 mt-0.5">{match.venue.location.city}{match.venue.location.state ? `, ${match.venue.location.state}` : ''}</p>
            )}
          </div>
        )}
        
        {match.format && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Format</p>
            <p className="font-semibold text-gray-900">
              {typeof match.format === 'object'
                ? (match.format.overs ? `${match.format.overs} overs${match.format.innings ? `, ${match.format.innings} innings` : ''}` : '-')
                : match.format}
            </p>
          </div>
        )}

        {match.createdAt && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Created</p>
            <p className="font-semibold text-gray-900">{new Date(match.createdAt).toLocaleDateString()}</p>
          </div>
        )}

        {match.matchType && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Type</p>
            <p className="font-semibold text-gray-900 capitalize">{match.matchType}</p>
          </div>
        )}
      </div>

      {/* Teams details */}
      <div className="grid grid-cols-1 gap-4">
        {homeTeam && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50/50 px-5 py-3 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Home Team</p>
              <p className="font-bold text-gray-900 mt-0.5">{homeTeam.name}</p>
            </div>
            {homeTeam.players && homeTeam.players.length > 0 && (
              <div className="px-5 py-3 space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Squad ({homeTeam.players.length})</p>
                <div className="flex flex-wrap gap-1">
                  {homeTeam.players.slice(0, 8).map((p, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg">
                      {p.name || p}
                    </span>
                  ))}
                  {homeTeam.players.length > 8 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                      +{homeTeam.players.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {awayTeam && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50/50 px-5 py-3 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Away Team</p>
              <p className="font-bold text-gray-900 mt-0.5">{awayTeam.name}</p>
            </div>
            {awayTeam.players && awayTeam.players.length > 0 && (
              <div className="px-5 py-3 space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Squad ({awayTeam.players.length})</p>
                <div className="flex flex-wrap gap-1">
                  {awayTeam.players.slice(0, 8).map((p, i) => (
                    <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-lg">
                      {p.name || p}
                    </span>
                  ))}
                  {awayTeam.players.length > 8 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                      +{awayTeam.players.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {match.status !== 'completed' && (
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => navigate(`/scoring/${id}`)}
            className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition active:scale-95"
          >
            <FiBarChart2 size={16} className="inline mr-1" /> View Live Scoring
          </button>
        </div>
      )}
    </motion.div>
  );
}
