import { FiMapPin, FiCalendar, FiClock } from 'react-icons/fi';
import { GiCricketBat } from 'react-icons/gi';

function buildPlayerMap(match) {
  const map = {};
  [...(match?.teams?.home?.players || []), ...(match?.teams?.away?.players || [])].forEach((p) => {
    if (p?._id) map[p._id.toString()] = p.name || 'Player';
  });
  return map;
}

export default function MatchSummaryTab({ match, score }) {
  const homeTeam = match.teams?.home;
  const awayTeam = match.teams?.away;
  const isCricket = match.sport === 'cricket';

  let topBatsman = null, topBowler = null;

  if (isCricket && score) {
    const playerNames = buildPlayerMap(match);
    const getName = (id) => (id ? playerNames[id.toString()] || 'Player' : null);

    const allBatting = {};
    const allBowling = {};

    const collectInnings = (inn) => {
      if (!inn) return;
      Object.entries(inn.battingCard || {}).forEach(([id, s]) => {
        if (!allBatting[id]) allBatting[id] = { ...s };
        else { allBatting[id].runs = (allBatting[id].runs || 0) + (s.runs || 0); }
      });
      Object.entries(inn.bowlingCard || {}).forEach(([id, s]) => {
        if (!allBowling[id]) allBowling[id] = { ...s };
        else {
          allBowling[id].wickets = (allBowling[id].wickets || 0) + (s.wickets || 0);
          allBowling[id].runs    = (allBowling[id].runs    || 0) + (s.runs    || 0);
        }
      });
    };

    (score.innings || []).forEach(collectInnings);
    collectInnings(score.currentInningsData);

    const battingList = Object.entries(allBatting)
      .map(([id, s]) => ({ id, name: getName(id), ...s }))
      .sort((a, b) => (b.runs ?? 0) - (a.runs ?? 0));
    if (battingList.length > 0) topBatsman = battingList[0];

    const bowlingList = Object.entries(allBowling)
      .map(([id, s]) => ({ id, name: getName(id), ...s }))
      .filter((b) => (b.wickets ?? 0) > 0)
      .sort((a, b) => (b.wickets ?? 0) - (a.wickets ?? 0) || (a.economy ?? 99) - (b.economy ?? 99));
    if (bowlingList.length > 0) topBowler = bowlingList[0];
  }

  const toss = match.toss;
  const tossTeamName = toss?.wonBy === 'home' ? homeTeam?.name : awayTeam?.name;

  return (
    <div className="p-4 space-y-4">

      {/* Result banner */}
      {match.result?.summary && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-600 text-base">🏆</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Result</p>
            <p className="text-sm font-bold text-emerald-900 mt-0.5">{match.result.summary}</p>
          </div>
        </div>
      )}

      {/* Toss */}
      {toss?.wonBy && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Toss</p>
          <p className="text-sm font-semibold text-indigo-900">
            {tossTeamName} won the toss and elected to {toss.decision || 'bat'}
          </p>
        </div>
      )}

      {/* Top performers — cricket only */}
      {isCricket && (topBatsman || topBowler) && (
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Top Performers</p>
          <div className="grid grid-cols-2 gap-3">
            {topBatsman && topBatsman.name && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <GiCricketBat size={13} className="text-blue-400" />
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Best Bat</p>
                </div>
                <p className="font-black text-blue-900 text-sm truncate">{topBatsman.name}</p>
                <p className="text-3xl font-black text-blue-700 mt-1 tabular-nums">{topBatsman.runs ?? 0}</p>
                <p className="text-xs text-blue-400 mt-0.5">({topBatsman.balls ?? 0} balls)</p>
              </div>
            )}
            {topBowler && topBowler.name && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <GiCricketBat size={13} className="text-red-400 rotate-180" />
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-wider">Best Bowl</p>
                </div>
                <p className="font-black text-red-900 text-sm truncate">{topBowler.name}</p>
                <p className="text-3xl font-black text-red-700 mt-1 tabular-nums">
                  {topBowler.wickets ?? 0}
                  <span className="text-lg text-red-400">/{topBowler.runs ?? 0}</span>
                </p>
                <p className="text-xs text-red-400 mt-0.5">{topBowler.overs ?? 0} overs</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Match details */}
      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-3">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Match Info</p>
        {match.format?.overs && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Format</span>
            <span className="font-semibold text-gray-900">
              {match.format.overs === 20 ? 'T20' : match.format.overs === 50 ? 'ODI' : match.format.overs === 10 ? 'T10' : `${match.format.overs}-over`}
            </span>
          </div>
        )}
        {match.venue?.name && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-gray-500">
              <FiMapPin size={11} /> Venue
            </div>
            <span className="font-semibold text-gray-900 text-right max-w-[200px] truncate">{match.venue.name}</span>
          </div>
        )}
        {match.scheduledAt && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-gray-500">
              <FiCalendar size={11} /> Date
            </div>
            <span className="font-semibold text-gray-900">
              {new Date(match.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        )}
        {match.startedAt && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-gray-500">
              <FiClock size={11} /> Started
            </div>
            <span className="font-semibold text-gray-900">
              {new Date(match.startedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Status</span>
          <span className="font-semibold text-gray-900 capitalize">{match.status}</span>
        </div>
      </div>
    </div>
  );
}
