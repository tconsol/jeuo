export default function RacketScoreboard({ score, sport }) {
  if (!score) return null;

  const isBadminton = sport === 'badminton';
  const maxPoints = isBadminton ? 21 : 11;
  const sportLabel = isBadminton ? 'Badminton' : 'Table Tennis';

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 shadow-elevated text-white">
        <p className="text-xs text-blue-200 uppercase tracking-wider mb-3">{sportLabel}</p>

        {/* Games (sets) overview */}
        <div className="overflow-x-auto">
          <table className="w-full text-center">
            <thead>
              <tr className="text-blue-200 text-xs">
                <th className="text-left py-2 px-4">Player</th>
                {score.games?.map((_, i) => (
                  <th key={i} className="py-2 px-3">G{i + 1}</th>
                ))}
                <th className="py-2 px-3 text-yellow-300">Current</th>
                <th className="py-2 px-3">Games</th>
              </tr>
            </thead>
            <tbody className="text-lg font-mono">
              {[0, 1].map((playerIdx) => (
                <tr key={playerIdx} className="border-t border-white/10">
                  <td className="text-left py-3 px-4 flex items-center gap-2">
                    {score.server === playerIdx && (
                      <span className="w-2 h-2 bg-yellow-400 rounded-full" title="Serving" />
                    )}
                    <span className="font-sans text-sm">P{playerIdx + 1}</span>
                  </td>
                  {score.games?.map((game, i) => (
                    <td key={i} className={`py-3 px-3 ${
                      game.points[playerIdx] > game.points[1 - playerIdx] ? 'text-yellow-300 font-bold' : 'text-blue-200'
                    }`}>
                      {game.points[playerIdx]}
                    </td>
                  ))}
                  <td className="py-3 px-3 text-yellow-300 font-bold">
                    {score.currentGame?.points?.[playerIdx] || 0}
                  </td>
                  <td className="py-3 px-3 font-bold">
                    {score.gamesWon?.[playerIdx] || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Setting point / Game point indicator */}
        {score.currentGame && (() => {
          const pts = score.currentGame.points || [0, 0];
          const needed = Math.max(maxPoints, Math.max(...pts) + 1);
          const lead = [0, 1].find(
            (i) => pts[i] >= maxPoints - 1 && pts[i] > pts[1 - i]
          );
          if (lead !== undefined) {
            const isMatchPoint =
              (score.gamesWon?.[lead] || 0) >= Math.floor((score.bestOf || 3) / 2);
            return (
              <p className={`text-center mt-2 text-sm font-medium ${isMatchPoint ? 'text-red-300' : 'text-yellow-300'}`}>
                {isMatchPoint ? 'Match Point' : 'Game Point'}   P{lead + 1}
              </p>
            );
          }
          return null;
        })()}
      </div>

      {/* Rally stats */}
      <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
        <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Rally Stats</h3>
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="font-semibold text-gray-900">P1</div><div className="text-gray-400"> </div><div className="font-semibold text-gray-900">P2</div>
          {[
            ['Points Won', score.pointsWon?.[0] || 0, score.pointsWon?.[1] || 0],
            ['Longest Rally', score.longestRally?.[0] || '-', score.longestRally?.[1] || '-'],
            ['Service Errors', score.serviceErrors?.[0] || 0, score.serviceErrors?.[1] || 0],
          ].map(([label, p1, p2]) => (
            <div key={label} className="contents">
              <div className="font-mono py-1 text-gray-700">{p1}</div>
              <div className="text-gray-400 py-1">{label}</div>
              <div className="font-mono py-1 text-gray-700">{p2}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
