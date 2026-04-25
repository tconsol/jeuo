import { useParams, useNavigate } from 'react-router-dom';
import { SportIcon } from '../utils/sportIcons';
import {
  FiMapPin, FiClock, FiBarChart2, FiUsers, FiInfo, FiArrowLeft, FiWifi,
  FiMessageCircle, FiActivity, FiLayers, FiAward,
} from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { connectMatchSocket, disconnectMatchSocket } from '../lib/socket';
import { setLiveScore, addEvent, setConnected, resetMatch } from '../store/slices/matchSlice';

import CricketScoreboard    from '../components/scoring/CricketScoreboard';
import FootballScoreboard   from '../components/scoring/FootballScoreboard';
import BasketballScoreboard from '../components/scoring/BasketballScoreboard';
import TennisScoreboard     from '../components/scoring/TennisScoreboard';
import RacketScoreboard     from '../components/scoring/RacketScoreboard';
import VolleyballScoreboard from '../components/scoring/VolleyballScoreboard';

import MatchSummaryTab     from '../components/match/MatchSummaryTab';
import CommentaryTab       from '../components/match/CommentaryTab';
import CricketStatsTab     from '../components/match/CricketStatsTab';
import CricketOversTab     from '../components/match/CricketOversTab';
import TournamentTableTab  from '../components/match/TournamentTableTab';

const SCOREBOARD_MAP = {
  cricket:      CricketScoreboard,
  football:     FootballScoreboard,
  basketball:   BasketballScoreboard,
  tennis:       TennisScoreboard,
  badminton:    RacketScoreboard,
  table_tennis: RacketScoreboard,
  volleyball:   VolleyballScoreboard,
};

const SPORT_GRADIENT = {
  cricket:      'from-emerald-600 via-emerald-700 to-teal-800',
  football:     'from-green-600 via-green-700 to-emerald-800',
  basketball:   'from-orange-500 via-orange-600 to-amber-700',
  tennis:       'from-lime-500 via-lime-600 to-green-700',
  badminton:    'from-blue-600 via-blue-700 to-indigo-800',
  volleyball:   'from-yellow-500 via-yellow-600 to-amber-700',
  table_tennis: 'from-red-500 via-red-600 to-rose-700',
};

function buildTabs(match) {
  const isCricket = match?.sport === 'cricket';
  const tabs = [
    { key: 'summary',   label: 'Summary',     icon: FiInfo },
    { key: 'scorecard', label: 'Scorecard',   icon: FiBarChart2 },
  ];
  if (isCricket) {
    tabs.push({ key: 'commentary', label: 'Commentary', icon: FiMessageCircle });
    tabs.push({ key: 'stats',      label: 'Stats',      icon: FiActivity });
    tabs.push({ key: 'overs',      label: 'Overs',      icon: FiLayers });
  }
  if (match?.tournament) {
    tabs.push({ key: 'table', label: 'Table', icon: FiAward });
  }
  tabs.push({ key: 'teams', label: 'Teams', icon: FiUsers });
  return tabs;
}

export default function MatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { liveScore, isConnected } = useSelector((s) => s.match);
  const [activeTab, setActiveTab] = useState('summary');
  const [commentary, setCommentary] = useState([]);

  // Match metadata
  const { data: match, isLoading, isError } = useQuery({
    queryKey: ['match', id],
    queryFn: () => api.get(`/matches/${id}`).then((r) => r.data.data.match),
    retry: 1,
  });

  // Score data
  const { data: scoreData } = useQuery({
    queryKey: ['match-score', id],
    queryFn: () =>
      api.get(`/scoring/${id}`).then((r) => {
        const d = r.data.data;
        if (d?.score !== undefined) return d.score;
        return d || {};
      }),
    enabled: !!match,
    retry: false,
  });

  // Seed commentary from match doc (auto-generated, last 200)
  useEffect(() => {
    if (match?.commentary?.length) {
      setCommentary(match.commentary);
    }
  }, [match]);

  useEffect(() => {
    if (scoreData) {
      dispatch(setLiveScore({ score: scoreData, scoreVersion: match?.scoringVersion }));
    }
  }, [scoreData, match, dispatch]);

  // Socket — live matches only
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
      if (data.commentary) setCommentary(data.commentary);
    });
    socket.on('match:status', (data) => {
      if (data.status === 'completed') window.location.reload();
    });

    return () => {
      socket.emit('leave:match', id);
      disconnectMatchSocket();
      dispatch(resetMatch());
    };
  }, [id, match?.status, dispatch]);

  const TABS = useMemo(() => buildTabs(match), [match]);

  // Reset to 'summary' if active tab is no longer valid (e.g. non-cricket match)
  useEffect(() => {
    if (TABS.length > 0 && !TABS.find((t) => t.key === activeTab)) {
      setActiveTab('summary');
    }
  }, [TABS, activeTab]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <div className="h-10 w-24 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-3xl animate-pulse" />
        <div className="h-12 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (isError || !match) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-6">
        <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-2">
          <FiBarChart2 size={36} className="text-red-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Match not found</h2>
        <p className="text-gray-400 text-sm max-w-xs">This match may have been removed or the link is incorrect.</p>
        <button onClick={() => navigate(-1)}
          className="mt-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition">
          ← Go Back
        </button>
      </div>
    );
  }

  const score = liveScore || scoreData;
  const ScoreboardComponent = SCOREBOARD_MAP[match.sport];
  const sportGradient = SPORT_GRADIENT[match.sport] || SPORT_GRADIENT.cricket;
  const homeTeam = match.teams?.home;
  const awayTeam = match.teams?.away;

  // Cricket: find each team's innings by battingTeam field
  let homeScore = null, awayScore = null, homeWickets = null, awayWickets = null;
  if (match.sport === 'cricket' && score) {
    const allInnings = [...(score.innings || [])];
    const cur = score.currentInningsData;
    if (cur) allInnings.push(cur);

    const homeInn = allInnings.find((i) => i.battingTeam === 'home');
    const awayInn = allInnings.find((i) => i.battingTeam === 'away');
    if (homeInn) { homeScore = homeInn.runs ?? 0; homeWickets = homeInn.wickets ?? null; }
    if (awayInn) { awayScore = awayInn.runs ?? 0; awayWickets = awayInn.wickets ?? null; }
  } else {
    homeScore = score?.homeGoals ?? score?.homeScore ?? score?.home?.goals ?? score?.home?.score ?? null;
    awayScore = score?.awayGoals ?? score?.awayScore ?? score?.away?.goals ?? score?.away?.score ?? null;
  }

  const statusConfig = {
    live:      { label: 'LIVE',      bg: 'bg-red-500',    pulse: true  },
    completed: { label: 'COMPLETED', bg: 'bg-white/20',   pulse: false },
    scheduled: { label: 'UPCOMING',  bg: 'bg-white/20',   pulse: false },
    paused:    { label: 'PAUSED',    bg: 'bg-amber-400',  pulse: false },
  };
  const sc = statusConfig[match.status] || statusConfig.scheduled;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-4 py-5 pb-24 space-y-4">

      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition font-medium">
        <FiArrowLeft size={16} /> Back
      </button>

      {/* ── Hero ── */}
      <div className={`bg-gradient-to-br ${sportGradient} rounded-3xl overflow-hidden shadow-xl`}>
        <div className="px-6 pt-6 pb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center">
              <SportIcon sport={match.sport} size={22} className="text-white" />
            </div>
            <div>
              <p className="text-white font-black capitalize text-base">{match.sport?.replace('_', ' ')}</p>
              <p className="text-white/50 text-xs">{match.tournament?.name || 'Friendly Match'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {match.status === 'live' && isConnected && (
              <span className="flex items-center gap-1 text-[10px] text-white/70 font-medium">
                <FiWifi size={10} className="text-green-300" /> Live
              </span>
            )}
            <span className={`text-[11px] font-black text-white px-3 py-1.5 rounded-full ${sc.bg} ${sc.pulse ? 'animate-pulse' : ''}`}>
              {sc.label}
            </span>
          </div>
        </div>

        {/* Teams & Score */}
        <div className="px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center">
              <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <span className="text-xl font-black text-white">{(homeTeam?.name || 'H')[0]}</span>
              </div>
              <p className="text-white font-bold text-sm truncate max-w-[100px] mx-auto">{homeTeam?.name || 'Home Team'}</p>
            </div>

            <div className="text-center min-w-[100px]">
              {homeScore !== null || awayScore !== null ? (
                <div>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-4xl font-black text-white tabular-nums">
                      {homeScore ?? '-'}{homeWickets !== null ? `/${homeWickets}` : ''}
                    </span>
                    <span className="text-white/40 text-2xl">–</span>
                    <span className="text-4xl font-black text-white tabular-nums">
                      {awayScore ?? '-'}{awayWickets !== null ? `/${awayWickets}` : ''}
                    </span>
                  </div>
                  {match.status === 'live' && score?.currentInningsData && (
                    <p className="text-white/60 text-xs mt-1">
                      {score.currentInningsData.overs ?? 0}.{score.currentInningsData.balls ?? 0} overs
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-5xl font-black text-white/30">VS</p>
                  {match.scheduledAt && (
                    <p className="text-white/60 text-xs mt-1">
                      {new Date(match.scheduledAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 text-center">
              <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <span className="text-xl font-black text-white">{(awayTeam?.name || 'A')[0]}</span>
              </div>
              <p className="text-white font-bold text-sm truncate max-w-[100px] mx-auto">{awayTeam?.name || 'Away Team'}</p>
            </div>
          </div>

          {/* Result */}
          {match.status === 'completed' && match.result && (
            <div className="mt-4 bg-white/10 rounded-2xl px-4 py-2.5 text-center">
              <p className="text-white font-bold text-sm">
                {match.result.summary
                  ? match.result.summary
                  : match.result.winner === 'home'
                    ? `${homeTeam?.name || 'Home'} won`
                    : match.result.winner === 'away'
                      ? `${awayTeam?.name || 'Away'} won`
                      : 'Match drawn'}
                {!match.result.summary && match.result.margin ? ` by ${match.result.margin}` : ''}
              </p>
            </div>
          )}
        </div>

        {/* Venue strip */}
        {match.venue && (
          <div className="px-6 pb-4 flex items-center gap-2 text-white/60 text-xs">
            <FiMapPin size={11} />
            <span>{match.venue.name}{match.venue.location?.city ? `, ${match.venue.location.city}` : ''}</span>
          </div>
        )}
      </div>

      {/* Live scoring CTA */}
      {match.status === 'live' && (
        <button onClick={() => navigate(`/scoring/${id}`)}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-black text-sm shadow-lg shadow-red-200 active:scale-95 transition flex items-center justify-center gap-2">
          <span className="w-2 h-2 bg-white rounded-full animate-ping" />
          View Live Scoring
        </button>
      )}

      {/* ── Tabs ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tab bar — horizontally scrollable */}
        <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-100">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-3.5 text-sm font-semibold transition whitespace-nowrap ${
                activeTab === key
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
              }`}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}>

            {/* Summary */}
            {activeTab === 'summary' && (
              <MatchSummaryTab match={match} score={score} />
            )}

            {/* Scorecard */}
            {activeTab === 'scorecard' && (
              <div className="p-4">
                {ScoreboardComponent && score ? (
                  <ScoreboardComponent score={score} match={match} />
                ) : match.status === 'scheduled' ? (
                  <div className="py-12 text-center">
                    <FiClock size={36} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">Match hasn't started yet</p>
                    {match.scheduledAt && (
                      <p className="text-gray-300 text-sm mt-1">
                        Starts {new Date(match.scheduledAt).toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <FiBarChart2 size={36} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">Score data not available</p>
                  </div>
                )}
              </div>
            )}

            {/* Commentary — cricket only */}
            {activeTab === 'commentary' && (
              <CommentaryTab commentary={commentary} />
            )}

            {/* Stats — cricket only */}
            {activeTab === 'stats' && (
              <CricketStatsTab score={score} match={match} />
            )}

            {/* Overs — cricket only */}
            {activeTab === 'overs' && (
              <CricketOversTab score={score} match={match} />
            )}

            {/* Table — only if tournament */}
            {activeTab === 'table' && match.tournament && (
              <TournamentTableTab tournament={match.tournament} />
            )}

            {/* Teams */}
            {activeTab === 'teams' && (
              <div className="p-4 space-y-4">
                {[
                  { team: homeTeam, label: 'Home Team', colorClass: 'bg-indigo-50 text-indigo-700' },
                  { team: awayTeam, label: 'Away Team', colorClass: 'bg-emerald-50 text-emerald-700' },
                ].map(({ team, label, colorClass }) => team && (
                  <div key={label} className="rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${colorClass}`}>
                        {(team.name || '?')[0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{team.name}</p>
                        <p className="text-[10px] text-gray-400">{label}</p>
                      </div>
                    </div>
                    {team.players?.length > 0 && (
                      <div className="px-4 py-3">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Squad · {team.players.length} players</p>
                        <div className="flex flex-wrap gap-1.5">
                          {team.players.map((p, i) => (
                            <span key={i} className={`px-2.5 py-1 rounded-lg text-xs font-medium ${colorClass}`}>
                              {p.name || p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
