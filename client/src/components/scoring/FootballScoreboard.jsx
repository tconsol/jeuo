import { FiAlertTriangle, FiSquare, FiBarChart2 } from 'react-icons/fi';
import { GiSoccerBall } from 'react-icons/gi';
import { motion } from 'framer-motion';

export default function FootballScoreboard({ score }) {
  if (!score) return (
    <div className="bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-2xl p-8 text-center text-white/60 text-sm shadow-lg">
      Waiting for match to start…
    </div>
  );

  return (
    <div className="space-y-3">
      {/* ── Score hero ── */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-2xl p-6 shadow-lg text-white">
        <div className="text-xs font-semibold bg-white/15 text-white/80 px-3 py-1 rounded-full w-fit mx-auto mb-5 uppercase tracking-wider capitalize">
          {score.period?.replace(/_/g, ' ') || 'Match'}
        </div>

        <div className="flex items-center justify-center gap-6">
          <div className="flex-1 text-center">
            <p className="text-xs text-emerald-300 uppercase tracking-widest mb-1">Home</p>
            <motion.span
              key={score.home?.goals}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.25 }}
              className="text-7xl font-extrabold tabular-nums block"
            >
              {score.home?.goals ?? 0}
            </motion.span>
          </div>

          <div className="text-3xl text-emerald-400 font-light">–</div>

          <div className="flex-1 text-center">
            <p className="text-xs text-emerald-300 uppercase tracking-widest mb-1">Away</p>
            <motion.span
              key={score.away?.goals}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.25 }}
              className="text-7xl font-extrabold tabular-nums block"
            >
              {score.away?.goals ?? 0}
            </motion.span>
          </div>
        </div>

        {/* Card indicators */}
        {((score.home?.yellowCards > 0) || (score.away?.yellowCards > 0) ||
          (score.home?.redCards > 0) || (score.away?.redCards > 0)) && (
          <div className="flex justify-between mt-4 px-2 text-xs">
            <span className="text-emerald-300">
              {score.home?.yellowCards > 0 && <span className="mr-1"><FiAlertTriangle size={12} className="inline text-yellow-600 mr-0.5" />×{score.home.yellowCards}</span>}
              {score.home?.redCards > 0 && <span><FiSquare size={12} className="inline text-red-600 mr-0.5" />×{score.home.redCards}</span>}
            </span>
            <span className="text-emerald-300">
              {score.away?.yellowCards > 0 && <span className="mr-1"><FiAlertTriangle size={12} className="inline text-yellow-600 mr-0.5" />×{score.away.yellowCards}</span>}
              {score.away?.redCards > 0 && <span><FiSquare size={12} className="inline text-red-600 mr-0.5" />×{score.away.redCards}</span>}
            </span>
          </div>
        )}
      </div>

      {/* ── Stats comparison ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50/60 border-b border-gray-100">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest"><FiBarChart2 size={12} className="inline mr-1" />Match Stats</span>
        </div>
        <div className="px-5 py-2 divide-y divide-gray-50">
          {[
            { label: 'Shots', home: score.home?.shots, away: score.away?.shots },
            { label: 'On Target', home: score.home?.shotsOnTarget, away: score.away?.shotsOnTarget },
            { label: 'Corners', home: score.home?.corners, away: score.away?.corners },
            { label: 'Fouls', home: score.home?.fouls, away: score.away?.fouls },
          ].map(({ label, home, away }) => {
            const total = (home || 0) + (away || 0);
            const homePct = total > 0 ? ((home || 0) / total) * 100 : 50;
            return (
              <div key={label} className="py-3">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-semibold text-gray-800 tabular-nums">{home ?? 0}</span>
                  <span className="text-gray-400 text-xs">{label}</span>
                  <span className="font-semibold text-gray-800 tabular-nums">{away ?? 0}</span>
                </div>
                <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100">
                  <div className="bg-emerald-500 rounded-full" style={{ width: `${homePct}%` }} />
                  <div className="bg-blue-400 rounded-full flex-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Goal scorers ── */}
      {(score.home?.goalScorers?.length > 0 || score.away?.goalScorers?.length > 0) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50/60 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest"><GiSoccerBall size={12} className="inline mr-1" />Goals</span>
          </div>
          <div className="grid grid-cols-2 divide-x divide-gray-50 px-5 py-3 gap-4">
            <div className="space-y-1">
              {score.home?.goalScorers?.map((g, i) => (
                <p key={i} className="text-sm text-gray-700">
                  {g.player}
                  <span className="text-gray-400 text-xs ml-1">{g.minute}'</span>
                  {g.type === 'penalty' && <span className="text-gray-400 text-xs"> (P)</span>}
                  {g.type === 'own_goal' && <span className="text-red-400 text-xs"> (OG)</span>}
                </p>
              ))}
            </div>
            <div className="space-y-1 pl-4 text-right">
              {score.away?.goalScorers?.map((g, i) => (
                <p key={i} className="text-sm text-gray-700">
                  <span className="text-gray-400 text-xs mr-1">{g.minute}'</span>
                  {g.player}
                  {g.type === 'penalty' && <span className="text-gray-400 text-xs"> (P)</span>}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
