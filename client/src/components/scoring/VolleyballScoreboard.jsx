export default function VolleyballScoreboard({ score }) {
  if (!score) return null;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-6 shadow-elevated text-white">
        {/* Sets overview */}
        <div className="overflow-x-auto">
          <table className="w-full text-center">
            <thead>
              <tr className="text-amber-200 text-xs">
                <th className="text-left py-2 px-4">Team</th>
                {score.sets?.map((_, i) => (
                  <th key={i} className="py-2 px-3">Set {i + 1}</th>
                ))}
                <th className="py-2 px-3 text-yellow-200">Current</th>
                <th className="py-2 px-3 font-bold">Sets</th>
              </tr>
            </thead>
            <tbody className="text-lg font-mono">
              {[0, 1].map((teamIdx) => (
                <tr key={teamIdx} className="border-t border-white/10">
                  <td className="text-left py-3 px-4 flex items-center gap-2">
                    {score.serving === teamIdx && (
                      <span className="w-2 h-2 bg-yellow-300 rounded-full" title="Serving" />
                    )}
                    <span className="font-sans text-sm">Team {teamIdx + 1}</span>
                  </td>
                  {score.sets?.map((set, i) => (
                    <td key={i} className={`py-3 px-3 ${
                      set.points[teamIdx] > set.points[1 - teamIdx] ? 'text-yellow-200 font-bold' : 'text-amber-200'
                    }`}>
                      {set.points[teamIdx]}
                    </td>
                  ))}
                  <td className="py-3 px-3 text-yellow-200 font-bold text-xl">
                    {score.currentSet?.points?.[teamIdx] || 0}
                  </td>
                  <td className="py-3 px-3 font-bold text-xl">
                    {score.setsWon?.[teamIdx] || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Set point / Match point indicator */}
      {score.currentSet && (() => {
        const pts = score.currentSet.points || [0, 0];
        const setNum = (score.sets?.length || 0) + 1;
        const target = setNum >= 5 ? 15 : 25;
        const lead = [0, 1].find(
          (i) => pts[i] >= target - 1 && pts[i] > pts[1 - i] && (pts[i] - pts[1 - i]) >= 1
        );
        if (lead !== undefined) {
          const isMatchPoint =
            (score.setsWon?.[lead] || 0) >= Math.floor((score.bestOf || 5) / 2);
          return (
            <div className={`text-center text-sm font-medium py-2 rounded-xl ${
              isMatchPoint ? 'bg-red-50 text-red-600 ring-1 ring-red-100' : 'bg-amber-50 text-amber-600 ring-1 ring-amber-100'
            }`}>
              {isMatchPoint ? 'Match Point' : 'Set Point'}   Team {lead + 1}
            </div>
          );
        }
        return null;
      })()}

      {/* Team stats */}
      <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
        <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Match Stats</h3>
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="font-semibold text-gray-900">Team 1</div><div className="text-gray-400"> </div><div className="font-semibold text-gray-900">Team 2</div>
          {[
            ['Points Won', score.pointsWon?.[0] || 0, score.pointsWon?.[1] || 0],
            ['Aces', score.aces?.[0] || 0, score.aces?.[1] || 0],
            ['Blocks', score.blocks?.[0] || 0, score.blocks?.[1] || 0],
            ['Errors', score.errors?.[0] || 0, score.errors?.[1] || 0],
            ['Timeouts Left', score.timeoutsLeft?.[0] ?? 2, score.timeoutsLeft?.[1] ?? 2],
          ].map(([label, t1, t2]) => (
            <div key={label} className="contents">
              <div className="font-mono py-1 text-gray-700">{t1}</div>
              <div className="text-gray-400 py-1">{label}</div>
              <div className="font-mono py-1 text-gray-700">{t2}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rotation display */}
      {score.rotation && (
        <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
          <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Rotation</h3>
          <div className="grid grid-cols-2 gap-4">
            {[0, 1].map((teamIdx) => (
              <div key={teamIdx}>
                <p className="text-xs text-gray-500 mb-1">Team {teamIdx + 1}</p>
                <div className="grid grid-cols-3 gap-1 text-xs text-center">
                  {(score.rotation[teamIdx] || []).map((pos, i) => (
                    <div key={i} className={`py-1 rounded-lg ${
                      i === 0 ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-100' : 'bg-gray-50 text-gray-600'
                    }`}>
                      {pos}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
