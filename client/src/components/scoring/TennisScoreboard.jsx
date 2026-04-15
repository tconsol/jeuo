const POINT_NAMES = ['0', '15', '30', '40'];

export default function TennisScoreboard({ score }) {
  if (!score) return null;

  const currentPointDisplay = () => {
    if (score.isTiebreak) {
      return `TB: ${score.tiebreakPoints[0]}-${score.tiebreakPoints[1]}`;
    }
    const game = score.currentGame;
    if (game?.isDeuce) {
      if (game.advantage === null) return 'Deuce';
      return `Advantage P${game.advantage + 1}`;
    }
    const p1 = POINT_NAMES[Math.min(game?.points?.[0] || 0, 3)];
    const p2 = POINT_NAMES[Math.min(game?.points?.[1] || 0, 3)];
    return `${p1}-${p2}`;
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-lime-600 to-green-700 rounded-2xl p-6 shadow-elevated text-white">
        {/* Set scores */}
        <div className="overflow-x-auto">
          <table className="w-full text-center">
            <thead>
              <tr className="text-green-200 text-xs">
                <th className="text-left py-2 px-4">Player</th>
                {score.sets?.map((_, i) => (
                  <th key={i} className="py-2 px-3">Set {i + 1}</th>
                ))}
                <th className="py-2 px-3">Current</th>
                <th className="py-2 px-3 text-yellow-300">Point</th>
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
                  {score.sets?.map((set, i) => (
                    <td key={i} className={`py-3 px-3 ${
                      set.games[playerIdx] > set.games[1 - playerIdx] ? 'text-yellow-300 font-bold' : 'text-green-200'
                    }`}>
                      {set.games[playerIdx]}
                      {set.tiebreak && <sup className="text-xs">{set.tiebreak.points[playerIdx]}</sup>}
                    </td>
                  ))}
                  <td className="py-3 px-3 font-bold">{score.currentSet?.games?.[playerIdx] || 0}</td>
                  <td className="py-3 px-3 text-yellow-300">
                    {score.isTiebreak
                      ? score.tiebreakPoints?.[playerIdx] || 0
                      : POINT_NAMES[Math.min(score.currentGame?.points?.[playerIdx] || 0, 3)]
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {score.currentGame?.isDeuce && (
          <p className="text-center text-yellow-300 mt-2 text-sm font-medium">
            {score.currentGame.advantage !== null
              ? `Advantage Player ${score.currentGame.advantage + 1}`
              : 'Deuce'
            }
          </p>
        )}
      </div>

      {/* Match stats */}
      <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
        <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Stats</h3>
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="font-semibold text-gray-900">P1</div><div className="text-gray-400">—</div><div className="font-semibold text-gray-900">P2</div>
          {[
            ['Aces', score.aces?.[0] || 0, score.aces?.[1] || 0],
            ['Double Faults', score.doubleFaults?.[0] || 0, score.doubleFaults?.[1] || 0],
            ['Winners', score.winners?.[0] || 0, score.winners?.[1] || 0],
            ['UE', score.unforcedErrors?.[0] || 0, score.unforcedErrors?.[1] || 0],
            ['Points Won', score.pointsWon?.[0] || 0, score.pointsWon?.[1] || 0],
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
