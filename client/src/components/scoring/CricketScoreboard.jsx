import { GiCricketBat } from 'react-icons/gi';
import { motion } from 'framer-motion';

export default function CricketScoreboard({ score }) {
  if (!score) return (
    <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-2xl p-8 text-center text-white/60 text-sm shadow-lg">
      Waiting for match to start…
    </div>
  );

  const innings = score.innings || [];
  const currentInnings = innings[score.currentInnings] || innings[0];
  const battingTeam = currentInnings;

  return (
    <div className="space-y-3">
      {/* ── Main score hero card ── */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-2xl p-6 shadow-lg text-white">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold bg-white/15 text-white/80 px-3 py-1 rounded-full uppercase tracking-wider">
            {score.currentInnings === 0 ? '1st Innings' : '2nd Innings'}
          </span>
          {score.oversConfig && (
            <span className="text-xs text-indigo-300">{score.oversConfig} ov match</span>
          )}
        </div>

        <div className="text-center">
          <motion.div
            key={battingTeam?.totalRuns}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 0.25 }}
            className="flex items-end justify-center gap-2"
          >
            <span className="text-7xl font-extrabold tracking-tight tabular-nums">
              {battingTeam?.totalRuns ?? 0}
            </span>
            <span className="text-4xl text-indigo-300 font-bold mb-1">
              /{battingTeam?.wickets ?? 0}
            </span>
          </motion.div>

          <p className="text-indigo-200 mt-2 text-base">
            {battingTeam?.overs ?? 0}.{battingTeam?.balls ?? 0} overs
          </p>

          {/* Stats row */}
          <div className="flex justify-center gap-5 mt-3 text-sm">
            {battingTeam?.currentRunRate > 0 && (
              <div className="text-center">
                <p className="text-indigo-300 text-xs uppercase tracking-wide">CRR</p>
                <p className="font-bold text-white">{battingTeam.currentRunRate.toFixed(2)}</p>
              </div>
            )}
            {battingTeam?.requiredRunRate > 0 && (
              <div className="text-center">
                <p className="text-indigo-300 text-xs uppercase tracking-wide">RRR</p>
                <p className="font-bold text-white">{battingTeam.requiredRunRate.toFixed(2)}</p>
              </div>
            )}
            {typeof battingTeam?.extras === 'number' && (
              <div className="text-center">
                <p className="text-indigo-300 text-xs uppercase tracking-wide">Extras</p>
                <p className="font-bold text-white">{battingTeam.extras}</p>
              </div>
            )}
          </div>
        </div>

        {/* This over balls */}
        {(battingTeam?.currentOverBalls?.length > 0) && (
          <div className="mt-5 pt-4 border-t border-indigo-500/40">
            <p className="text-xs text-indigo-300 uppercase tracking-widest mb-2">This Over</p>
            <div className="flex gap-1.5 flex-wrap">
              {battingTeam.currentOverBalls.map((ball, i) => (
                <span
                  key={i}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                    ball === 'W' ? 'bg-red-500 text-white' :
                    ball === 4   ? 'bg-blue-400 text-white' :
                    ball === 6   ? 'bg-purple-500 text-white' :
                    ball === 'Wd' || ball === 'Nb' ? 'bg-amber-400 text-amber-900' :
                    'bg-white/15 text-white'
                  }`}
                >
                  {ball}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Batting ── */}
      {battingTeam?.batters && Object.values(battingTeam.batters).some((b) => !b.out) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50/60 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest"><GiCricketBat size={16} className="inline mr-1" /> Batting</span>
            <span className="text-xs text-gray-400">R (B) 4s 6s SR</span>
          </div>
          <div className="divide-y divide-gray-50">
            {Object.entries(battingTeam.batters)
              .filter(([, s]) => !s.out)
              .map(([id, s]) => (
                <div key={id} className="flex items-center px-5 py-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-900 text-sm truncate">{s.name || id}</span>
                      {s.isStriker && (
                        <span className="text-indigo-500 font-bold text-xs" title="On Strike">*</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-right shrink-0">
                    <span className="font-bold text-gray-900 tabular-nums w-6 text-right">{s.runs}</span>
                    <span className="text-gray-400 tabular-nums">({s.balls})</span>
                    <span className="text-blue-500 tabular-nums text-xs">{s.fours}</span>
                    <span className="text-purple-500 tabular-nums text-xs">{s.sixes}</span>
                    <span className="text-gray-400 text-xs tabular-nums">{s.strikeRate?.toFixed(1)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Bowling ── */}
      {battingTeam?.bowlers && Object.values(battingTeam.bowlers).some((b) => b.isCurrentBowler) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50/60 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest"><GiCricketBat size={14} className="inline mr-1 text-red-500" /> Bowling</span>
          </div>
          {Object.entries(battingTeam.bowlers)
            .filter(([, s]) => s.isCurrentBowler)
            .map(([id, s]) => (
              <div key={id} className="flex items-center justify-between px-5 py-3">
                <span className="font-semibold text-gray-900 text-sm">{s.name || id}</span>
                <div className="flex items-center gap-3 text-sm text-gray-600 tabular-nums">
                  <span className="font-mono">{s.overs}-{s.maidens}-{s.runs}-{s.wickets}</span>
                  <span className="text-gray-400 text-xs">Econ {s.economy?.toFixed(1)}</span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ── Previous innings summary ── */}
      {innings.length > 1 && innings[0] && (
        <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 flex items-center justify-between text-sm">
          <span className="text-gray-500 text-xs uppercase tracking-wider">1st Innings</span>
          <span className="font-bold text-gray-700 tabular-nums">
            {innings[0].totalRuns}/{innings[0].wickets} ({innings[0].overs}.{innings[0].balls} ov)
          </span>
        </div>
      )}
    </div>
  );
}
