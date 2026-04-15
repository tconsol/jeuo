export default function FixturesBracket({ fixtures }) {
  if (!fixtures?.length) return <p className="text-sm text-gray-400 py-4">Fixtures not yet generated.</p>;

  const rounds = fixtures.reduce((acc, f) => {
    const r = f.round || 1;
    if (!acc[r]) acc[r] = [];
    acc[r].push(f);
    return acc;
  }, {});

  return (
    <div className="flex gap-6 overflow-x-auto py-4">
      {Object.entries(rounds).map(([round, matches]) => (
        <div key={round} className="flex-shrink-0 min-w-[200px]">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Round {round}</h4>
          <div className="space-y-3">
            {matches.map((match) => (
              <div key={match._id} className="bg-white rounded-lg border border-gray-200 p-3 text-sm">
                <div className={`flex justify-between ${match.winner === match.teamA?._id ? 'font-bold' : ''}`}>
                  <span>{match.teamA?.name || 'TBD'}</span>
                  <span>{match.scoreA ?? '-'}</span>
                </div>
                <div className="border-t border-gray-100 my-1" />
                <div className={`flex justify-between ${match.winner === match.teamB?._id ? 'font-bold' : ''}`}>
                  <span>{match.teamB?.name || 'TBD'}</span>
                  <span>{match.scoreB ?? '-'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
