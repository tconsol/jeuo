import { motion } from 'framer-motion';

export default function FootballScoreboard({ score }) {
  if (!score) return null;

  return (
    <div className="space-y-4">
      {/* Main score */}
      <div className="bg-gradient-to-br from-accent-600 to-accent-800 rounded-2xl p-6 shadow-elevated text-white">
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-sm text-accent-200 mb-2">Home</p>
            <motion.span
              key={score.home?.goals}
              animate={{ scale: [1, 1.15, 1] }}
              className="text-6xl font-display font-bold"
            >
              {score.home?.goals || 0}
            </motion.span>
          </div>
          <div className="text-accent-300 text-2xl font-mono">—</div>
          <div className="text-center">
            <p className="text-sm text-accent-200 mb-2">Away</p>
            <motion.span
              key={score.away?.goals}
              animate={{ scale: [1, 1.15, 1] }}
              className="text-6xl font-display font-bold"
            >
              {score.away?.goals || 0}
            </motion.span>
          </div>
        </div>
        <p className="text-center text-accent-200 mt-3 text-sm capitalize">{score.period?.replace(/_/g, ' ')}</p>
      </div>

      {/* Stats comparison */}
      <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
        <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Match Stats</h3>
        {[
          { label: 'Shots', home: score.home?.shots, away: score.away?.shots },
          { label: 'On Target', home: score.home?.shotsOnTarget, away: score.away?.shotsOnTarget },
          { label: 'Corners', home: score.home?.corners, away: score.away?.corners },
          { label: 'Fouls', home: score.home?.fouls, away: score.away?.fouls },
          { label: 'Yellow Cards', home: score.home?.yellowCards, away: score.away?.yellowCards },
          { label: 'Red Cards', home: score.home?.redCards, away: score.away?.redCards },
        ].map(({ label, home, away }) => (
          <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <span className="font-mono text-sm w-8 text-right text-gray-900">{home || 0}</span>
            <span className="text-gray-500 text-sm">{label}</span>
            <span className="font-mono text-sm w-8 text-gray-900">{away || 0}</span>
          </div>
        ))}
      </div>

      {/* Goal scorers */}
      {(score.home?.goalScorers?.length > 0 || score.away?.goalScorers?.length > 0) && (
        <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
          <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Goals</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              {score.home?.goalScorers?.map((g, i) => (
                <p key={i} className="text-sm text-gray-700 py-1">
                  ⚽ {g.player} <span className="text-gray-400">{g.minute}'</span>
                  {g.type === 'penalty' && <span className="text-gray-400"> (P)</span>}
                  {g.type === 'own_goal' && <span className="text-red-500"> (OG)</span>}
                </p>
              ))}
            </div>
            <div className="text-right">
              {score.away?.goalScorers?.map((g, i) => (
                <p key={i} className="text-sm text-gray-700 py-1">
                  <span className="text-gray-400">{g.minute}'</span> {g.player} ⚽
                  {g.type === 'penalty' && <span className="text-gray-400"> (P)</span>}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
