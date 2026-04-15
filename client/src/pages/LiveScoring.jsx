import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { matchSocket } from '../lib/socket';

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

/* ─── Sport-specific scorer panels ───────────────────────── */

function CricketScorerPanel({ onEvent }) {
  const [extras, setExtras] = useState(null);
  const [wicket, setWicket] = useState(false);

  const submitBall = (runs) => {
    const payload = { type: 'delivery', data: { runs, isWicket: wicket } };
    if (extras) {
      payload.data.isExtra = true;
      payload.data.extraType = extras;
      payload.data.extraRuns = runs;
    }
    onEvent(payload);
    setExtras(null);
    setWicket(false);
  };

  return (
    <div className="space-y-4">
      {/* Runs */}
      <div>
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Runs</p>
        <div className="grid grid-cols-7 gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((r) => (
            <button key={r} onClick={() => submitBall(r)}
              className="btn-primary py-3 text-lg font-bold">{r}</button>
          ))}
        </div>
      </div>
      {/* Extras toggle */}
      <div>
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Extras</p>
        <div className="flex gap-2 flex-wrap">
          {['wide', 'no_ball', 'bye', 'leg_bye'].map((e) => (
            <button key={e} onClick={() => setExtras(extras === e ? null : e)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                extras === e ? 'bg-yellow-500 text-black' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>{e.replace('_', ' ')}</button>
          ))}
        </div>
      </div>
      {/* Wicket toggle */}
      <div className="flex items-center gap-3">
        <button onClick={() => setWicket(!wicket)}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            wicket ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}>
          Wicket {wicket ? '✓' : ''}
        </button>
      </div>
      {/* Quick actions */}
      <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-200">
        <button onClick={() => onEvent({ type: 'end_over' })}
          className="btn-ghost text-sm">End Over</button>
        <button onClick={() => onEvent({ type: 'end_innings' })}
          className="btn-danger text-sm">End Innings</button>
      </div>
    </div>
  );
}

function FootballScorerPanel({ onEvent }) {
  const [team, setTeam] = useState(0);
  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-3">
        {[0, 1].map((t) => (
          <button key={t} onClick={() => setTeam(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
              team === t ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}>Team {t + 1}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => onEvent({ type: 'goal', data: { team } })}
          className="btn-primary py-3 text-sm font-bold">⚽ Goal</button>
        <button onClick={() => onEvent({ type: 'goal', data: { team, isOwnGoal: true } })}
          className="bg-red-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700">OG</button>
        <button onClick={() => onEvent({ type: 'yellow_card', data: { team } })}
          className="bg-yellow-500 text-black py-3 rounded-xl text-sm font-bold hover:bg-yellow-600">Yellow</button>
        <button onClick={() => onEvent({ type: 'red_card', data: { team } })}
          className="bg-red-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-600">Red</button>
        <button onClick={() => onEvent({ type: 'substitution', data: { team } })}
          className="bg-gray-100 text-gray-600 py-3 rounded-xl text-sm hover:bg-gray-200">Sub</button>
        <button onClick={() => onEvent({ type: 'corner', data: { team } })}
          className="bg-gray-100 text-gray-600 py-3 rounded-xl text-sm hover:bg-gray-200">Corner</button>
        <button onClick={() => onEvent({ type: 'shot', data: { team, onTarget: true } })}
          className="bg-gray-100 text-gray-600 py-3 rounded-xl text-sm hover:bg-gray-200">Shot (on)</button>
        <button onClick={() => onEvent({ type: 'shot', data: { team, onTarget: false } })}
          className="bg-gray-100 text-gray-600 py-3 rounded-xl text-sm hover:bg-gray-200">Shot (off)</button>
      </div>
      <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-200">
        <button onClick={() => onEvent({ type: 'half_time' })} className="btn-ghost text-sm">Half Time</button>
        <button onClick={() => onEvent({ type: 'full_time' })} className="btn-ghost text-sm">Full Time</button>
        <button onClick={() => onEvent({ type: 'penalty_shootout_start' })} className="btn-danger text-sm">Penalties</button>
      </div>
    </div>
  );
}

function BasketballScorerPanel({ onEvent }) {
  const [team, setTeam] = useState(0);
  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-3">
        {[0, 1].map((t) => (
          <button key={t} onClick={() => setTeam(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
              team === t ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}>Team {t + 1}</button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => onEvent({ type: 'field_goal_2pt', data: { team, made: true } })}
          className="btn-primary py-3 text-sm font-bold">+2</button>
        <button onClick={() => onEvent({ type: 'field_goal_3pt', data: { team, made: true } })}
          className="bg-accent-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-accent-600">+3</button>
        <button onClick={() => onEvent({ type: 'free_throw', data: { team, made: true } })}
          className="bg-yellow-500 text-black py-3 rounded-xl text-sm font-bold hover:bg-yellow-600">FT</button>
        <button onClick={() => onEvent({ type: 'field_goal_2pt', data: { team, made: false } })}
          className="bg-gray-100 text-gray-500 py-3 rounded-xl text-xs hover:bg-gray-200">Miss 2pt</button>
        <button onClick={() => onEvent({ type: 'field_goal_3pt', data: { team, made: false } })}
          className="bg-gray-100 text-gray-500 py-3 rounded-xl text-xs hover:bg-gray-200">Miss 3pt</button>
        <button onClick={() => onEvent({ type: 'free_throw', data: { team, made: false } })}
          className="bg-gray-100 text-gray-500 py-3 rounded-xl text-xs hover:bg-gray-200">Miss FT</button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <button onClick={() => onEvent({ type: 'rebound', data: { team, offensive: false } })}
          className="bg-gray-100 text-gray-600 py-2 rounded-xl text-xs hover:bg-gray-200">Def Reb</button>
        <button onClick={() => onEvent({ type: 'rebound', data: { team, offensive: true } })}
          className="bg-gray-100 text-gray-600 py-2 rounded-xl text-xs hover:bg-gray-200">Off Reb</button>
        <button onClick={() => onEvent({ type: 'steal', data: { team } })}
          className="bg-gray-100 text-gray-600 py-2 rounded-xl text-xs hover:bg-gray-200">Steal</button>
        <button onClick={() => onEvent({ type: 'block', data: { team } })}
          className="bg-gray-100 text-gray-600 py-2 rounded-xl text-xs hover:bg-gray-200">Block</button>
        <button onClick={() => onEvent({ type: 'turnover', data: { team } })}
          className="bg-gray-100 text-gray-600 py-2 rounded-xl text-xs hover:bg-gray-200">TO</button>
        <button onClick={() => onEvent({ type: 'foul', data: { team } })}
          className="bg-yellow-600/80 text-white py-2 rounded-xl text-xs hover:bg-yellow-700">Foul</button>
        <button onClick={() => onEvent({ type: 'timeout', data: { team } })}
          className="bg-gray-100 text-gray-600 py-2 rounded-xl text-xs hover:bg-gray-200">Timeout</button>
        <button onClick={() => onEvent({ type: 'quarter_end' })}
          className="bg-gray-100 text-gray-600 py-2 rounded-xl text-xs hover:bg-gray-200">End Qtr</button>
      </div>
    </div>
  );
}

function TennisScorerPanel({ onEvent }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400 uppercase tracking-wider">Point Won By</p>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onEvent({ type: 'point', data: { winner: 0 } })}
          className="btn-primary py-4 text-lg font-bold">Player 1</button>
        <button onClick={() => onEvent({ type: 'point', data: { winner: 1 } })}
          className="bg-accent-500 text-white py-4 rounded-xl text-lg font-bold hover:bg-accent-600">Player 2</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => onEvent({ type: 'ace' })}
          className="bg-yellow-500 text-black py-2 rounded-xl text-sm font-medium hover:bg-yellow-600">Ace</button>
        <button onClick={() => onEvent({ type: 'double_fault' })}
          className="bg-red-500/80 text-white py-2 rounded-xl text-sm font-medium hover:bg-red-600">Double Fault</button>
      </div>
    </div>
  );
}

function RacketScorerPanel({ onEvent, sport }) {
  const label = sport === 'badminton' ? 'Badminton' : 'Table Tennis';
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label} — Rally Won By</p>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onEvent({ type: 'rally_point', data: { winner: 0 } })}
          className="btn-primary py-4 text-lg font-bold">Player 1</button>
        <button onClick={() => onEvent({ type: 'rally_point', data: { winner: 1 } })}
          className="bg-accent-500 text-white py-4 rounded-xl text-lg font-bold hover:bg-accent-600">Player 2</button>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onEvent({ type: 'service_fault' })}
          className="bg-yellow-500 text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-yellow-600">Service Fault</button>
        <button onClick={() => onEvent({ type: 'let' })}
          className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm hover:bg-gray-200">Let</button>
      </div>
    </div>
  );
}

function VolleyballScorerPanel({ onEvent }) {
  const [team, setTeam] = useState(0);
  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-3">
        {[0, 1].map((t) => (
          <button key={t} onClick={() => setTeam(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
              team === t ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}>Team {t + 1}</button>
        ))}
      </div>
      <p className="text-xs text-gray-400 uppercase tracking-wider">Rally Point Type</p>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => onEvent({ type: 'rally_point', data: { winner: team, type: 'kill' } })}
          className="btn-primary py-3 text-sm font-bold">Kill</button>
        <button onClick={() => onEvent({ type: 'rally_point', data: { winner: team, type: 'ace' } })}
          className="bg-accent-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-accent-600">Ace</button>
        <button onClick={() => onEvent({ type: 'rally_point', data: { winner: team, type: 'block' } })}
          className="bg-yellow-500 text-black py-3 rounded-xl text-sm font-bold hover:bg-yellow-600">Block</button>
        <button onClick={() => onEvent({ type: 'rally_point', data: { winner: team, type: 'opponent_error' } })}
          className="bg-gray-100 text-gray-600 py-3 rounded-xl text-sm hover:bg-gray-200">Opp Error</button>
      </div>
      <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-200">
        <button onClick={() => onEvent({ type: 'timeout', data: { team } })}
          className="btn-ghost text-sm">Timeout</button>
        <button onClick={() => onEvent({ type: 'substitution', data: { team } })}
          className="btn-ghost text-sm">Sub</button>
      </div>
    </div>
  );
}

const SCORER_MAP = {
  cricket: CricketScorerPanel,
  football: FootballScorerPanel,
  basketball: BasketballScorerPanel,
  tennis: TennisScorerPanel,
  badminton: RacketScorerPanel,
  table_tennis: RacketScorerPanel,
  volleyball: VolleyballScorerPanel,
};

/* ─── Main LiveScoring Page ──────────────────────────────── */

export default function LiveScoring() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [match, setMatch] = useState(null);
  const [score, setScore] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/scoring/${matchId}`);
        setMatch(data.match);
        setScore(data.score);
        setEvents(data.events || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load match');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;
    matchSocket.connect();
    matchSocket.emit('match:join', matchId);
    const onScoreUpdate = (data) => {
      setScore(data.score);
      if (data.event) setEvents((prev) => [...prev, data.event]);
    };
    matchSocket.on('score:update', onScoreUpdate);
    return () => {
      matchSocket.emit('match:leave', matchId);
      matchSocket.off('score:update', onScoreUpdate);
    };
  }, [matchId]);

  const handleEvent = useCallback(async (event) => {
    setSubmitting(true);
    try {
      await api.post(`/scoring/${matchId}/events`, event);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record event');
    } finally {
      setSubmitting(false);
    }
  }, [matchId]);

  const handleUndo = useCallback(async () => {
    try {
      await api.post(`/scoring/${matchId}/undo`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to undo');
    }
  }, [matchId]);

  const handleStartMatch = useCallback(async () => {
    try {
      await api.post(`/scoring/${matchId}/start`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start match');
    }
  }, [matchId]);

  const handleEndMatch = useCallback(async () => {
    try {
      await api.post(`/scoring/${matchId}/end`);
      navigate(`/matches/${matchId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to end match');
    }
  }, [matchId, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !match) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={() => navigate(-1)} className="btn-ghost">Go Back</button>
      </div>
    );
  }

  const ScoreboardComponent = SCOREBOARD_MAP[match.sport];
  const ScorerPanel = SCORER_MAP[match.sport];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Live Scoring</h1>
          <p className="text-sm text-gray-400 capitalize">{match.sport?.replace('_', ' ')}</p>
        </div>
        <div className="flex items-center gap-2">
          {match.status === 'scheduled' && (
            <button onClick={handleStartMatch} className="btn-primary text-sm">Start Match</button>
          )}
          {match.status === 'live' && (
            <button onClick={handleEndMatch} className="btn-danger text-sm">End Match</button>
          )}
          <span className={`badge ${
            match.status === 'live' ? 'badge-success' :
            match.status === 'completed' ? 'badge-default' : 'badge-warning'
          }`}>
            {match.status}
          </span>
        </div>
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scoreboard */}
      {ScoreboardComponent && (
        <ScoreboardComponent score={score} sport={match.sport} />
      )}

      {/* Scorer controls */}
      {match.status === 'live' && ScorerPanel && (
        <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Scorer Panel</h2>
            <div className="flex gap-2">
              <button onClick={handleUndo} disabled={events.length === 0}
                className="text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition">
                ↩ Undo
              </button>
            </div>
          </div>
          <div className={submitting ? 'opacity-50 pointer-events-none' : ''}>
            <ScorerPanel onEvent={handleEvent} sport={match.sport} />
          </div>
        </div>
      )}

      {/* Recent events log */}
      {events.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
          <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">
            Recent Events ({events.length})
          </h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {[...events].reverse().slice(0, 20).map((evt, i) => (
              <div key={evt._id || i} className="flex items-center justify-between text-xs py-1 border-b border-gray-100">
                <span className="text-gray-600">{evt.type?.replace(/_/g, ' ')}</span>
                <span className="text-gray-400">
                  {evt.createdAt ? new Date(evt.createdAt).toLocaleTimeString() : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
