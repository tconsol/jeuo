import { motion } from 'framer-motion';

export default function CricketScoreboard({ score }) {
  if (!score) return null;

  const innings = score.innings || [];
  const currentInnings = innings[score.currentInnings] || innings[0];
  const battingTeam = currentInnings;

  return (
    <div className="space-y-4">
      {/* Main score card */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 shadow-elevated text-white">
        <div className="text-center">
          <p className="text-sm text-primary-200 mb-2">
            {score.currentInnings === 0 ? '1st Innings' : '2nd Innings'}
          </p>
          <motion.div
            key={battingTeam?.totalRuns}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-6xl font-display font-bold">
              {battingTeam?.totalRuns || 0}
            </span>
            <span className="text-3xl text-primary-200 font-display">/</span>
            <span className="text-3xl text-primary-200 font-display">{battingTeam?.wickets || 0}</span>
          </motion.div>
          <p className="text-primary-200 mt-2">
            {battingTeam?.overs || 0}.{battingTeam?.balls || 0} overs
            {score.oversConfig ? ` (${score.oversConfig})` : ''}
          </p>
          {battingTeam?.currentRunRate > 0 && (
            <p className="text-sm text-primary-300 mt-1">CRR: {battingTeam.currentRunRate.toFixed(2)}</p>
          )}
        </div>
      </div>

      {/* Current batters */}
      {battingTeam?.batters && (
        <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
          <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Batting</h3>
          <div className="space-y-2">
            {Object.entries(battingTeam.batters)
              .filter(([, stats]) => !stats.out)
              .map(([playerId, stats]) => (
                <div key={playerId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{stats.name || playerId}</span>
                    {stats.isStriker && <span className="text-primary-600 text-xs font-bold">*</span>}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-mono font-bold text-gray-900">{stats.runs}</span>
                    <span className="text-gray-400">({stats.balls})</span>
                    <span className="text-gray-400">{stats.fours}×4</span>
                    <span className="text-gray-400">{stats.sixes}×6</span>
                    <span className="text-gray-400">SR {stats.strikeRate?.toFixed(1)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Current bowler */}
      {battingTeam?.bowlers && (
        <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
          <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Bowling</h3>
          {Object.entries(battingTeam.bowlers)
            .filter(([, stats]) => stats.isCurrentBowler)
            .map(([playerId, stats]) => (
              <div key={playerId} className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{stats.name || playerId}</span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-700">{stats.overs}-{stats.maidens}-{stats.runs}-{stats.wickets}</span>
                  <span className="text-gray-400">Econ {stats.economy?.toFixed(1)}</span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Recent balls */}
      <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
        <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">This Over</h3>
        <div className="flex gap-2 flex-wrap">
          {(battingTeam?.currentOverBalls || []).map((ball, i) => (
            <span
              key={i}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                ball === 'W' ? 'bg-red-50 text-red-600 ring-1 ring-red-100' :
                ball === 4 ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-100' :
                ball === 6 ? 'bg-purple-50 text-purple-600 ring-1 ring-purple-100' :
                ball === 'Wd' || ball === 'Nb' ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-100' :
                'bg-gray-100 text-gray-700'
              }`}
            >
              {ball}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
