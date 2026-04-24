import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRadio, FiRefreshCw } from 'react-icons/fi';
import { GiCricketBat, GiSoccerBall, GiBasketballBall, GiTennisBall, GiShuttlecock, GiVolleyballBall, GiPingPongBat } from 'react-icons/gi';
import api from '../lib/api';

const SPORT_ICON = {
  cricket: GiCricketBat, football: GiSoccerBall, basketball: GiBasketballBall,
  tennis: GiTennisBall, badminton: GiShuttlecock, volleyball: GiVolleyballBall, table_tennis: GiPingPongBat,
};

function SportAvatar({ sport, size = 16, className = '' }) {
  const Icon = SPORT_ICON[sport] || GiCricketBat;
  return <Icon size={size} className={className} />;
}

function fmtOvers(totalBalls) {
  if (totalBalls == null) return null;
  return `${Math.floor(totalBalls / 6)}.${totalBalls % 6}`;
}

function fmtScheduled(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isTomorrow = d.toDateString() === new Date(now.getTime() + 86400000).toDateString();
  const t = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const day = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  return { day, time: t };
}

function TeamRow({ name, snap, isWinner, battingNow, sport }) {
  // Extract overs safely - handle multiple possible formats
  let totalBalls = snap?.totalBalls ?? snap?.balls;
  if (!totalBalls && snap?.overs != null) {
    totalBalls = snap.overs * 6;
  }
  const overs = totalBalls != null ? fmtOvers(totalBalls) : null;
  
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isWinner ? 'bg-indigo-100' : 'bg-gray-100'}`}>
          <SportAvatar sport={sport} size={14} className={isWinner ? 'text-indigo-600' : 'text-gray-400'} />
        </div>
        <div className="min-w-0">
          <p className={`text-sm truncate leading-tight ${isWinner ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>{name}</p>
          {battingNow && <p className="text-[10px] text-indigo-500 font-semibold leading-none mt-0.5">batting</p>}
        </div>
      </div>
      {snap && (snap.runs != null || snap.wickets != null) ? (
        <span className="shrink-0 font-bold text-sm text-gray-800 tabular-nums">
          {snap.runs ?? 0}<span className="text-gray-400 font-normal">/{snap.wickets ?? 0}</span>
          {overs != null && <span className="text-xs font-normal text-gray-400 ml-1">({overs})</span>}
        </span>
      ) : (
        <span className="text-gray-300 text-sm shrink-0">—</span>
      )}
    </div>
  );
}

function MatchCard({ match }) {
  const home = match.teams?.home;
  const away = match.teams?.away;
  const snap = match.scoreSnapshot;
  const isLive = match.status === 'live';
  const isDone = match.status === 'completed';
  const isSched = match.status === 'scheduled';
  const winner = match.result?.winner;
  const result = match.result?.summary;
  const homeSnap = snap?.home ?? snap?.teamA;
  const awaySnap = snap?.away ?? snap?.teamB;
  const battingTeam = snap?.battingTeam;
  const sched = fmtScheduled(match.scheduledAt ?? match.startedAt);
  const meta = [match.format?.name, match.venue?.name].filter(Boolean).join(' · ');

  return (
    <Link to={`/scoring/${match._id}`}
      className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.99] transition-all duration-150 overflow-hidden">
      {/* Meta bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-50">
        <p className="text-[11px] text-gray-400 truncate flex items-center gap-1.5">
          <SportAvatar sport={match.sport} size={11} className="text-gray-400 shrink-0" />
          <span className="uppercase font-semibold">{match.sport}</span>
          {meta && <><span className="text-gray-200">·</span><span className="truncate">{meta}</span></>}
        </p>
        {isLive && (
          <span className="ml-2 shrink-0 inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-full ring-1 ring-red-100">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />LIVE
          </span>
        )}
        {isDone && <span className="ml-2 shrink-0 text-[10px] font-semibold text-gray-400 uppercase">Final</span>}
      </div>

      {/* Body */}
      <div className="flex items-stretch px-4 py-3 gap-3">
        {/* Teams */}
        <div className="flex-1 min-w-0 space-y-3">
          <TeamRow name={home?.name || 'Home'} snap={homeSnap} isWinner={winner === 'home'} battingNow={isLive && battingTeam === 'home'} sport={match.sport} />
          <TeamRow name={away?.name || 'Away'} snap={awaySnap} isWinner={winner === 'away'} battingNow={isLive && battingTeam === 'away'} sport={match.sport} />
        </div>
        <div className="w-px bg-gray-100 shrink-0" />
        {/* Right */}
        <div className="w-24 shrink-0 flex flex-col items-center justify-center text-center gap-0.5 px-1">
          {isDone && result ? (
            <>
              <p className="text-xs font-bold text-orange-500 leading-tight line-clamp-2">
                {result.includes(' by ') ? result.split(' by ')[0] : result}
              </p>
              {result.includes(' by ') && <p className="text-[11px] text-gray-400">by {result.split(' by ')[1]}</p>}
            </>
          ) : isSched && sched ? (
            <>
              <p className="text-[11px] font-semibold text-gray-400">{sched.day}</p>
              <p className="text-base font-black text-gray-800">{sched.time}</p>
            </>
          ) : isLive ? (
            <p className="text-[11px] text-gray-400 font-medium">
              {match.startedAt ? new Date(match.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Progress'}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

const FILTERS = [
  { id: 'live', label: 'Live', dot: true },
  { id: 'scheduled', label: 'Upcoming' },
  { id: 'completed', label: 'Results' },
];

export default function LiveMatches() {
  const [filter, setFilter] = useState('live');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['matches-list', filter],
    queryFn: async () => {
      if (filter === 'live') {
        const { data } = await api.get('/matches/live');
        let matches = data.data?.matches || data.matches || [];
        
        // Fetch scores for live matches
        matches = await Promise.all(matches.map(async (match) => {
          try {
            const scoreRes = await api.get(`/scoring/${match._id}`);
            const scoreData = scoreRes.data?.data?.score || scoreRes.data?.score;
            
            if (scoreData) {
              const currentInnings = scoreData.currentInningsData;
              const allInnings = scoreData.innings || [];
              
              // Initialize scoreSnapshot
              match.scoreSnapshot = {
                home: null,
                away: null,
                battingTeam: currentInnings?.battingTeam
              };
              
              // Get scores for all completed innings first
              allInnings.forEach(innings => {
                if (innings.isComplete) {
                  const teamKey = innings.battingTeam;
                  if (teamKey) {
                    match.scoreSnapshot[teamKey] = {
                      runs: innings.runs ?? 0,
                      wickets: innings.wickets ?? 0,
                      totalBalls: innings.totalBalls ?? 0
                    };
                  }
                }
              });
              
              // If there's a current innings, update the score for the batting team
              if (currentInnings) {
                const teamKey = currentInnings.battingTeam;
                if (teamKey) {
                  match.scoreSnapshot[teamKey] = {
                    runs: currentInnings.runs ?? 0,
                    wickets: currentInnings.wickets ?? 0,
                    totalBalls: currentInnings.totalBalls ?? 0
                  };
                }
              }
            }
          } catch (err) {
            // If score fetch fails, just continue without score
            console.warn(`Failed to fetch score for match ${match._id}:`, err);
          }
          return match;
        }));
        
        return matches;
      }
      const { data } = await api.get(`/matches?status=${filter}&limit=30`);
      return data.data?.matches || data.matches || [];
    },
    // Live uses WebSocket (no polling needed). Scheduled/Completed poll periodically.
    refetchInterval: filter === 'live' ? false : 10000,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <FiRadio className="text-red-500" size={20} /> Matches
        </h1>
        {/* Only show refresh for non-live tabs (Upcoming/Results auto-refresh via polling) */}
        {filter !== 'live' && (
          <button onClick={() => refetch()} disabled={isFetching}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition disabled:opacity-40">
            <FiRefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-4 bg-gray-100 p-1 rounded-xl">
        {FILTERS.map(({ id, label, dot }) => (
          <button key={id} onClick={() => setFilter(id)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${filter === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {dot && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 align-middle animate-pulse" />}
            {label}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => <div key={i} className="h-[108px] bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      )}

      <AnimatePresence mode="wait">
        {!isLoading && (
          <motion.div key={filter} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {!data || data.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <FiRadio size={24} className="text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-600">
                  {filter === 'live' ? 'No live matches right now' : filter === 'scheduled' ? 'No upcoming matches' : 'No results yet'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {filter === 'live' ? 'Check back soon or start a match.' : 'Nothing here yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.map((match) => <MatchCard key={match._id} match={match} />)}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
