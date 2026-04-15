import { motion } from 'framer-motion';

export default function BasketballScoreboard({ score }) {
  if (!score) return null;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-coral-500 to-coral-700 rounded-2xl p-6 shadow-elevated text-white">
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-sm text-coral-100 mb-2">Home</p>
            <motion.span key={score.home?.points} animate={{ scale: [1, 1.15, 1] }} className="text-6xl font-display font-bold">
              {score.home?.points || 0}
            </motion.span>
          </div>
          <div className="text-center">
            <p className="text-sm text-coral-200">
              {score.isOvertime ? `OT${score.overtime}` : `Q${score.period}`}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-coral-100 mb-2">Away</p>
            <motion.span key={score.away?.points} animate={{ scale: [1, 1.15, 1] }} className="text-6xl font-display font-bold">
              {score.away?.points || 0}
            </motion.span>
          </div>
        </div>

        {/* Score by quarter */}
        {score.scoreByPeriod && (
          <div className="flex justify-center gap-1 mt-4">
            {score.scoreByPeriod.home?.map((_, i) => (
              <div key={i} className="text-center px-3 py-1 bg-white/10 rounded-lg text-xs">
                <p className="text-coral-200">{i < score.totalPeriods ? `Q${i + 1}` : `OT${i - score.totalPeriods + 1}`}</p>
                <p className="font-mono">{score.scoreByPeriod.home[i]}-{score.scoreByPeriod.away[i]}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
        <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Team Stats</h3>
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="font-semibold text-gray-900">Home</div><div className="text-gray-400">Stat</div><div className="font-semibold text-gray-900">Away</div>
          {[
            ['FG%', score.home?.fieldGoalsAttempted ? ((score.home.fieldGoalsMade / score.home.fieldGoalsAttempted) * 100).toFixed(1) + '%' : '0%',
                    score.away?.fieldGoalsAttempted ? ((score.away.fieldGoalsMade / score.away.fieldGoalsAttempted) * 100).toFixed(1) + '%' : '0%'],
            ['3PT', `${score.home?.threePointersMade || 0}/${score.home?.threePointersAttempted || 0}`,
                    `${score.away?.threePointersMade || 0}/${score.away?.threePointersAttempted || 0}`],
            ['FT', `${score.home?.freeThrowsMade || 0}/${score.home?.freeThrowsAttempted || 0}`,
                   `${score.away?.freeThrowsMade || 0}/${score.away?.freeThrowsAttempted || 0}`],
            ['Rebounds', (score.home?.offensiveRebounds || 0) + (score.home?.defensiveRebounds || 0),
                        (score.away?.offensiveRebounds || 0) + (score.away?.defensiveRebounds || 0)],
            ['Assists', score.home?.assists || 0, score.away?.assists || 0],
            ['Turnovers', score.home?.turnovers || 0, score.away?.turnovers || 0],
          ].map(([label, home, away]) => (
            <div key={label} className="contents">
              <div className="font-mono py-1 text-gray-700">{home}</div>
              <div className="text-gray-400 py-1">{label}</div>
              <div className="font-mono py-1 text-gray-700">{away}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
