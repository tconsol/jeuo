import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRadio, FiRefreshCw, FiCalendar, FiCheckCircle, FiMapPin, FiClock } from 'react-icons/fi';
import { GiCricketBat, GiSoccerBall, GiBasketballBall, GiTennisBall, GiShuttlecock, GiVolleyballBall, GiPingPongBat } from 'react-icons/gi';
import api from '../lib/api';

const SPORT_ICON = {
  cricket: GiCricketBat, football: GiSoccerBall, basketball: GiBasketballBall,
  tennis: GiTennisBall, badminton: GiShuttlecock, volleyball: GiVolleyballBall, table_tennis: GiPingPongBat,
};

const SPORT_COLOR = {
  cricket: 'from-emerald-500 to-teal-600',
  football: 'from-green-500 to-emerald-600',
  basketball: 'from-orange-500 to-amber-600',
  tennis: 'from-lime-500 to-green-600',
  badminton: 'from-blue-500 to-indigo-600',
  volleyball: 'from-yellow-500 to-amber-600',
  table_tennis: 'from-red-500 to-rose-600',
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
  const day = isToday ? 'Today' : isTomorrow ? 'Tomorrow'
    : d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  return { day, time: t };
}

function TeamRow({ name, snap, isWinner, battingNow, sport }) {
  let totalBalls = snap?.totalBalls ?? snap?.balls;
  if (!totalBalls && snap?.overs != null) totalBalls = snap.overs * 6;
  const overs = totalBalls != null ? fmtOvers(totalBalls) : null;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-xs ${
          isWinner ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {(name || '?')[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className={`text-sm truncate leading-tight ${
            isWinner ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'
          }`}>{name}</p>
          {battingNow && (
            <p className="text-[10px] text-indigo-500 font-bold leading-none mt-0.5 flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" /> batting
            </p>
          )}
        </div>
      </div>
      {snap && (snap.runs != null || snap.wickets != null) ? (
        <span className="shrink-0 font-black text-sm text-gray-900 tabular-nums">
          {snap.runs ?? 0}
          <span className="text-gray-400 font-normal text-xs">/{snap.wickets ?? 0}</span>
          {overs != null && <span className="text-xs font-normal text-gray-400 ml-1">({overs})</span>}
        </span>
      ) : (
        <span className="text-gray-200 text-sm shrink-0 font-bold">—</span>
      )}
    </div>
  );
}

function MatchCard({ match, tab }) {
  const home = match.teams?.home;
  const away = match.teams?.away;
  const snap = match.scoreSnapshot;
  const isLive = match.status === 'live';
  const isDone = match.status === 'completed';
  const winner = match.result?.winner;
  const result = match.result?.summary;
  const homeSnap = snap?.home ?? snap?.teamA;
  const awaySnap = snap?.away ?? snap?.teamB;
  const battingTeam = snap?.battingTeam;
  const sched = fmtScheduled(match.scheduledAt ?? match.startedAt);
  const gradient = SPORT_COLOR[match.sport] || SPORT_COLOR.cricket;

  // Live matches → scoring page; others → match detail page
  const href = isLive ? `/scoring/${match._id}` : `/matches/${match._id}`;

  return (
    <Link to={href}
      className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.99] transition-all duration-150 overflow-hidden group">

      {/* Sport accent bar */}
      <div className={`h-1 bg-gradient-to-r ${gradient}`} />

      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-3 pb-0">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <SportAvatar sport={match.sport} size={12} className="text-white" />
          </div>
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">{match.sport?.replace('_', ' ')}</span>
          {match.venue?.name && (
            <span className="text-[10px] text-gray-300 truncate max-w-[120px] flex items-center gap-0.5">
              <FiMapPin size={9} /> {match.venue.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {isLive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-black rounded-full ring-1 ring-red-100">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />LIVE
            </span>
          )}
          {isDone && <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Final</span>}
          {match.status === 'scheduled' && <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Upcoming</span>}
        </div>
      </div>

      {/* Body */}
      <div className="flex items-stretch px-4 py-3.5 gap-3">
        <div className="flex-1 min-w-0 space-y-3">
          <TeamRow name={home?.name || 'Home'} snap={homeSnap} isWinner={winner === 'home'}
            battingNow={isLive && battingTeam === 'home'} sport={match.sport} />
          <TeamRow name={away?.name || 'Away'} snap={awaySnap} isWinner={winner === 'away'}
            battingNow={isLive && battingTeam === 'away'} sport={match.sport} />
        </div>

        <div className="w-px bg-gray-100 shrink-0 mx-1" />

        <div className="w-24 shrink-0 flex flex-col items-center justify-center text-center gap-0.5">
          {isDone && result ? (
            <>
              <FiCheckCircle size={14} className="text-emerald-500 mb-0.5" />
              <p className="text-xs font-bold text-gray-700 leading-tight line-clamp-2">
                {result.includes(' by ') ? result.split(' by ')[0] : result}
              </p>
              {result.includes(' by ') && (
                <p className="text-[10px] text-gray-400">by {result.split(' by ')[1]}</p>
              )}
            </>
          ) : match.status === 'scheduled' && sched ? (
            <>
              <FiCalendar size={13} className="text-blue-400 mb-0.5" />
              <p className="text-[11px] font-semibold text-gray-400">{sched.day}</p>
              <p className="text-sm font-black text-gray-800">{sched.time}</p>
            </>
          ) : isLive ? (
            <>
              <FiClock size={13} className="text-red-400 mb-0.5" />
              <p className="text-[10px] text-gray-400 font-medium">
                {match.startedAt
                  ? new Date(match.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'In Progress'}
              </p>
            </>
          ) : null}
        </div>
      </div>

      {/* Tournament strip */}
      {match.tournament?.name && (
        <div className="px-4 pb-3 pt-0">
          <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-lg">
            {match.tournament.name}
          </span>
        </div>
      )}
    </Link>
  );
}

const TABS = [
  { id: 'live',      label: 'Live',     icon: FiRadio,       dot: true  },
  { id: 'scheduled', label: 'Upcoming', icon: FiCalendar,    dot: false },
  { id: 'completed', label: 'Results',  icon: FiCheckCircle, dot: false },
];

export default function LiveMatches() {
  const [tab, setTab] = useState('live');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['matches-list', tab],
    queryFn: async () => {
      if (tab === 'live') {
        const { data } = await api.get('/matches/live');
        let matches = data.data?.matches || [];

        // Enrich live matches with score snapshot
        matches = await Promise.all(matches.map(async (match) => {
          try {
            const scoreRes = await api.get(`/scoring/${match._id}`);
            const scoreData = scoreRes.data?.data?.score || scoreRes.data?.score;
            if (scoreData) {
              const currentInnings = scoreData.currentInningsData;
              const allInnings = scoreData.innings || [];
              match.scoreSnapshot = { home: null, away: null, battingTeam: currentInnings?.battingTeam };
              allInnings.forEach((inn) => {
                if (inn.isComplete && inn.battingTeam) {
                  match.scoreSnapshot[inn.battingTeam] = { runs: inn.runs ?? 0, wickets: inn.wickets ?? 0, totalBalls: inn.totalBalls ?? 0 };
                }
              });
              if (currentInnings?.battingTeam) {
                match.scoreSnapshot[currentInnings.battingTeam] = {
                  runs: currentInnings.runs ?? 0, wickets: currentInnings.wickets ?? 0, totalBalls: currentInnings.totalBalls ?? 0,
                };
              }
            }
          } catch { /* score fetch failed — continue without snapshot */ }
          return match;
        }));
        return matches;
      }
      const { data } = await api.get(`/matches?status=${tab}&limit=30`);
      return data.data?.matches || [];
    },
    refetchInterval: tab === 'live' ? false : 15000,
  });

  const counts = { live: tab === 'live' && data ? data.length : 0 };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 pb-24">

      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <span className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
              <FiRadio size={16} className="text-red-500" />
            </span>
            Matches
          </h1>
          <p className="text-gray-400 text-xs mt-0.5 ml-10">Live scores, fixtures & results</p>
        </div>
        <button onClick={() => refetch()} disabled={isFetching}
          className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition disabled:opacity-40">
          <FiRefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1.5 mb-5 bg-gray-100 p-1.5 rounded-2xl">
        {TABS.map(({ id, label, icon: Icon, dot }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
              tab === id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}>
            {dot && tab !== id ? (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            ) : (
              <Icon size={12} />
            )}
            {label}
            {id === 'live' && data?.length > 0 && tab === 'live' && (
              <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ml-0.5">
                {data.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[120px] bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {!isLoading && (
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {!data || data.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center mx-auto mb-4 border border-gray-100">
                  {tab === 'live'      && <FiRadio      size={28} className="text-gray-200" />}
                  {tab === 'scheduled' && <FiCalendar   size={28} className="text-gray-200" />}
                  {tab === 'completed' && <FiCheckCircle size={28} className="text-gray-200" />}
                </div>
                <p className="text-sm font-bold text-gray-600">
                  {tab === 'live'      ? 'No live matches right now'  :
                   tab === 'scheduled' ? 'No upcoming matches'        :
                                         'No results yet'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {tab === 'live' ? 'Check back soon or start a match from the scoring page.' : 'Nothing here yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.map((match) => (
                  <motion.div key={match._id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <MatchCard match={match} tab={tab} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
