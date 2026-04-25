import { GiCricketBat } from 'react-icons/gi';
import { motion } from 'framer-motion';

function buildPlayerMap(match) {
  const map = {};
  const all = [
    ...(match?.teams?.home?.players || []),
    ...(match?.teams?.away?.players || []),
  ];
  all.forEach((p) => {
    if (p?._id) map[p._id.toString()] = p.name || 'Player';
  });
  return map;
}

function getBallDisplay(ball) {
  if (ball && typeof ball === 'object') {
    if (ball.isWicket) return { label: 'W', cls: 'bg-red-500 text-white' };
    if (!ball.isLegalDelivery) {
      if (ball.extraType === 'wide')    return { label: 'Wd', cls: 'bg-amber-400 text-amber-900' };
      if (ball.extraType === 'no_ball') return { label: 'NB', cls: 'bg-amber-400 text-amber-900' };
    }
    if (ball.runs === 6) return { label: '6', cls: 'bg-purple-500 text-white' };
    if (ball.runs === 4) return { label: '4', cls: 'bg-blue-400 text-white' };
    if (ball.runs === 0) return { label: '·', cls: 'bg-white/15 text-white/70' };
    return { label: String(ball.runs), cls: 'bg-white/15 text-white' };
  }
  // Legacy primitive format
  if (ball === 'W')                       return { label: 'W',   cls: 'bg-red-500 text-white' };
  if (ball === 4)                         return { label: '4',   cls: 'bg-blue-400 text-white' };
  if (ball === 6)                         return { label: '6',   cls: 'bg-purple-500 text-white' };
  if (ball === 'Wd' || ball === 'Nb')     return { label: ball,  cls: 'bg-amber-400 text-amber-900' };
  return { label: String(ball ?? ''), cls: 'bg-white/15 text-white' };
}

function InningsCard({ innings, playerNames, isCurrent }) {
  const getName = (id) => (id ? playerNames[id.toString()] || 'Player' : '—');

  const battingEntries = Object.entries(innings.battingCard || {});
  const bowlingEntries = Object.entries(innings.bowlingCard || {});
  const fow    = innings.fow || [];
  const extras = innings.extras || {};

  const extrasTotal = typeof extras === 'object'
    ? (extras.wides || 0) + (extras.noBalls || 0) + (extras.byes || 0) + (extras.legByes || 0) + (extras.penalties || 0)
    : (typeof extras === 'number' ? extras : 0);

  return (
    <div className="space-y-3">
      {/* Batting */}
      {battingEntries.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50/60 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              <GiCricketBat size={16} className="inline mr-1" /> Batting
            </span>
            <span className="text-xs text-gray-400">R (B) 4s 6s SR</span>
          </div>
          <div className="divide-y divide-gray-50">
            {battingEntries.map(([id, s]) => {
              const isStriker = isCurrent && innings.batsmen?.striker === id;
              return (
                <div key={id} className={`flex items-center px-5 py-3 gap-3 ${s.out ? 'opacity-55' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm truncate">{getName(id)}</span>
                      {isStriker && !s.out && (
                        <span className="text-indigo-500 font-black text-xs">*</span>
                      )}
                      {s.out && (
                        <span className="text-[10px] text-gray-400 capitalize">{s.outDesc || 'out'}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-right shrink-0">
                    <span className="font-bold text-gray-900 tabular-nums w-6 text-right">{s.runs ?? 0}</span>
                    <span className="text-gray-400 tabular-nums">({s.balls ?? 0})</span>
                    <span className="text-blue-500 tabular-nums text-xs w-4 text-center">{s.fours ?? 0}</span>
                    <span className="text-purple-500 tabular-nums text-xs w-4 text-center">{s.sixes ?? 0}</span>
                    <span className="text-gray-400 text-xs tabular-nums w-10 text-right">
                      {(s.balls ?? 0) > 0 ? (((s.runs ?? 0) / s.balls) * 100).toFixed(1) : '0.0'}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Extras row */}
            <div className="flex items-center px-5 py-2 bg-gray-50/40 text-xs">
              <div className="flex-1 text-gray-500">
                Extras
                {typeof extras === 'object' && extrasTotal > 0 && (
                  <span className="ml-2 text-gray-400">
                    (W {extras.wides || 0}, NB {extras.noBalls || 0}, B {extras.byes || 0}, LB {extras.legByes || 0}{extras.penalties ? `, P ${extras.penalties}` : ''})
                  </span>
                )}
              </div>
              <span className="font-semibold text-gray-700">{extrasTotal}</span>
            </div>

            {/* Total row */}
            <div className="flex items-center px-5 py-2.5 bg-gray-50">
              <div className="flex-1 text-sm font-bold text-gray-700">Total</div>
              <span className="font-black text-gray-900 text-sm tabular-nums">
                {innings.runs ?? 0}/{innings.wickets ?? 0} ({innings.overs ?? 0}.{innings.balls ?? 0} ov)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bowling */}
      {bowlingEntries.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50/60 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Bowling
            </span>
            <span className="text-xs text-gray-400">O M R W ER</span>
          </div>
          <div className="divide-y divide-gray-50">
            {bowlingEntries.map(([id, s]) => {
              const isBowling = isCurrent && !innings.isComplete && innings.currentBowler === id;
              return (
                <div key={id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="font-semibold text-gray-900 text-sm truncate">{getName(id)}</span>
                    {isBowling && <span className="text-indigo-500 font-black text-xs flex-shrink-0">*</span>}
                  </div>
                  <div className="flex items-center gap-2 text-sm tabular-nums shrink-0">
                    <span className="font-mono text-gray-900 w-6 text-center">{s.overs ?? 0}</span>
                    <span className="font-mono text-gray-900 w-6 text-center">{s.maidens ?? 0}</span>
                    <span className="font-mono text-gray-900 w-6 text-center">{s.runs ?? 0}</span>
                    <span className="font-mono text-gray-900 w-6 text-center">{s.wickets ?? 0}</span>
                    <span className="text-gray-600 text-xs w-12 text-right">
                      {(s.overs ?? 0) > 0 ? ((s.runs ?? 0) / s.overs).toFixed(2) : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fall of Wickets */}
      {fow.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50/60 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Fall of Wickets</span>
          </div>
          <div className="px-5 py-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {fow.map((f, i) => (
              <span key={i} className="text-xs text-gray-600">
                <span className="font-bold text-gray-900">{f.runs}/{f.wicket}</span>
                <span className="text-gray-400 ml-1">({f.overs} ov, {getName(f.batter)})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CricketScoreboard({ score, match }) {
  if (!score || !score.currentInningsData) {
    return (
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-2xl p-8 text-center text-white/60 text-sm shadow-lg">
        Waiting for match to start…
      </div>
    );
  }

  const playerNames = buildPlayerMap(match);

  const current     = score.currentInningsData;
  const prevInnings = score.innings || [];

  const inningsNum   = prevInnings.length + 1;
  const inningsLabel = `${inningsNum}${inningsNum === 1 ? 'st' : inningsNum === 2 ? 'nd' : inningsNum === 3 ? 'rd' : 'th'} Innings`;

  const currentOverBalls = current.currentOver || [];

  const extrasTotal = current.extras
    ? (current.extras.wides || 0) + (current.extras.noBalls || 0) +
      (current.extras.byes || 0) + (current.extras.legByes || 0) +
      (current.extras.penalties || 0)
    : (typeof current.extras === 'number' ? current.extras : null);

  const totalBalls = current.totalBalls || 0;
  const crr = totalBalls > 0 ? ((current.runs / totalBalls) * 6).toFixed(2) : null;

  const target     = current.target || null;
  const runsNeeded = target ? target - current.runs : null;

  return (
    <div className="space-y-3">
      {/* ── Main score hero ── */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-2xl p-6 shadow-lg text-white">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold bg-white/15 text-white/80 px-3 py-1 rounded-full uppercase tracking-wider">
            {inningsLabel}
          </span>
          {score.oversPerInnings && (
            <span className="text-xs text-indigo-300">{score.oversPerInnings} ov match</span>
          )}
        </div>

        <div className="text-center">
          <motion.div
            key={current.runs}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 0.25 }}
            className="flex items-end justify-center gap-2"
          >
            <span className="text-7xl font-extrabold tracking-tight tabular-nums">
              {current.runs ?? 0}
            </span>
            <span className="text-4xl text-indigo-300 font-bold mb-1">
              /{current.wickets ?? 0}
            </span>
          </motion.div>

          <p className="text-indigo-200 mt-2 text-base">
            {current.overs ?? 0}.{current.balls ?? 0} overs
          </p>

          {target !== null && (
            <p className="text-amber-300 text-sm mt-1 font-semibold">
              Target: {target}
              {runsNeeded > 0 ? ` · Need ${runsNeeded} more` : ' · Won!'}
            </p>
          )}

          <div className="flex justify-center gap-6 mt-3 text-sm">
            {crr && (
              <div className="text-center">
                <p className="text-indigo-300 text-xs uppercase tracking-wide">CRR</p>
                <p className="font-bold text-white">{crr}</p>
              </div>
            )}
            {extrasTotal !== null && (
              <div className="text-center">
                <p className="text-indigo-300 text-xs uppercase tracking-wide">Extras</p>
                <p className="font-bold text-white">{extrasTotal}</p>
              </div>
            )}
          </div>
        </div>

        {/* This over */}
        {currentOverBalls.length > 0 && (
          <div className="mt-5 pt-4 border-t border-indigo-500/40">
            <p className="text-xs text-indigo-300 uppercase tracking-widest mb-2">This Over</p>
            <div className="flex gap-1.5 flex-wrap">
              {currentOverBalls.map((ball, i) => {
                const { label, cls } = getBallDisplay(ball);
                return (
                  <span
                    key={i}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${cls}`}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Full scorecard: completed innings ── */}
      {prevInnings.map((inn, idx) => (
        <div key={idx}>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
            {idx + 1}{idx === 0 ? 'st' : idx === 1 ? 'nd' : 'rd'} Innings
            {inn.battingTeam ? ` · ${inn.battingTeam === 'home' ? match?.teams?.home?.name : match?.teams?.away?.name}` : ''}
          </p>
          <InningsCard innings={inn} playerNames={playerNames} isCurrent={false} />
        </div>
      ))}

      {/* ── Current innings scorecard ── */}
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
          {inningsLabel}
          {current.battingTeam ? ` · ${current.battingTeam === 'home' ? match?.teams?.home?.name : match?.teams?.away?.name}` : ''}
        </p>
        <InningsCard innings={current} playerNames={playerNames} isCurrent={true} />
      </div>
    </div>
  );
}
