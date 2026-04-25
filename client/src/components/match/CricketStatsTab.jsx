function buildPlayerMap(match) {
  const map = {};
  [...(match?.teams?.home?.players || []), ...(match?.teams?.away?.players || [])].forEach((p) => {
    if (p?._id) map[p._id.toString()] = p.name || 'Player';
  });
  return map;
}

function InningsStats({ innings, playerNames, label }) {
  const getName = (id) => (id ? playerNames[id.toString()] || 'Player' : '—');

  const fow = innings?.fow || [];
  const extras = innings?.extras || {};
  const wides    = extras.wides    || 0;
  const noBalls  = extras.noBalls  || 0;
  const byes     = extras.byes     || 0;
  const legByes  = extras.legByes  || 0;
  const penalties = extras.penalties || 0;
  const extrasTotal = wides + noBalls + byes + legByes + penalties;

  // Derive batting stats
  const totalBalls = innings?.totalBalls || 0;
  const battingCard = innings?.battingCard || {};

  let dotBalls = 0, fours = 0, sixes = 0;
  Object.values(battingCard).forEach((s) => {
    fours += s.fours || 0;
    sixes += s.sixes || 0;
  });
  // Approximate dot balls from overHistory if available
  const overHistory = innings?.overHistory || [];
  overHistory.forEach((ov) => {
    (ov.detail || []).forEach((b) => {
      if (b.isLegalDelivery && !b.isWicket && b.runs === 0) dotBalls += 1;
    });
  });

  const boundaryRuns = fours * 4 + sixes * 6;
  const totalRuns = innings?.runs || 0;

  const hasStats = fow.length > 0 || extrasTotal > 0 || totalBalls > 0;
  if (!hasStats) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-black text-gray-500 uppercase tracking-widest px-1">{label}</p>

      {/* Fall of Wickets */}
      {fow.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50/70 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Fall of Wickets</span>
          </div>
          <div className="divide-y divide-gray-50">
            {fow.map((f, i) => (
              <div key={i} className="flex items-center px-3 sm:px-5 py-2.5 gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-red-100 text-red-700 text-xs font-black flex items-center justify-center flex-shrink-0">
                  {f.wicket}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{getName(f.batter)}</p>
                  <p className="text-xs text-gray-400 capitalize truncate">{f.howOut?.replace(/_/g, ' ') || 'out'}{f.bowler ? ` b. ${getName(f.bowler)}` : ''}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-gray-900 tabular-nums">{f.runs}/{f.wicket}</p>
                  <p className="text-xs text-gray-400">{f.overs} ov</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extras */}
      {extrasTotal > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50/70 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Extras</span>
          </div>
          <div className="px-3 sm:px-5 py-3 grid grid-cols-3 gap-2">
            {[
              { label: 'Wides',    value: wides },
              { label: 'No Balls', value: noBalls },
              { label: 'Byes',     value: byes },
              { label: 'Leg Byes', value: legByes },
              { label: 'Penalties',value: penalties },
              { label: 'Total',    value: extrasTotal, highlight: true },
            ].map(({ label: l, value, highlight }) => (
              <div key={l} className={`text-center p-2 sm:p-2.5 rounded-xl ${highlight ? 'bg-indigo-50' : 'bg-gray-50'}`}>
                <p className={`text-base sm:text-lg font-black tabular-nums ${highlight ? 'text-indigo-700' : 'text-gray-800'}`}>{value}</p>
                <p className={`text-[10px] font-semibold mt-0.5 ${highlight ? 'text-indigo-400' : 'text-gray-400'}`}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Boundary analysis */}
      {(fours > 0 || sixes > 0 || dotBalls > 0) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50/70 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Scoring Breakdown</span>
          </div>
          <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Fours',     value: fours,    sub: `${fours * 4} runs`,             bg: 'bg-blue-50',   text: 'text-blue-700'   },
              { label: 'Sixes',     value: sixes,    sub: `${sixes * 6} runs`,             bg: 'bg-purple-50', text: 'text-purple-700' },
              { label: 'Dot Balls', value: dotBalls, sub: 'deliveries',                    bg: 'bg-gray-50',   text: 'text-gray-700'   },
              { label: 'Boundary%', value: totalRuns > 0 ? `${Math.round((boundaryRuns / totalRuns) * 100)}%` : '0%',
                sub: `${boundaryRuns} of ${totalRuns} runs`,                               bg: 'bg-amber-50',  text: 'text-amber-700'  },
            ].map(({ label: l, value, sub, bg, text }) => (
              <div key={l} className={`${bg} rounded-xl p-3 text-center`}>
                <p className={`text-xl font-black tabular-nums ${text}`}>{value}</p>
                <p className="text-[10px] font-semibold text-gray-400 mt-0.5">{l}</p>
                <p className="text-[10px] text-gray-400">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CricketStatsTab({ score, match }) {
  if (!score) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400 text-sm">Stats not available</p>
      </div>
    );
  }

  const playerNames = buildPlayerMap(match);
  const prevInnings = score.innings || [];
  const current     = score.currentInningsData;

  const allInnings = [
    ...prevInnings.map((inn, i) => ({ inn, label: `${i + 1}${i === 0 ? 'st' : 'nd'} Innings` })),
    ...(current ? [{ inn: current, label: `${prevInnings.length + 1}${prevInnings.length === 0 ? 'st' : prevInnings.length === 1 ? 'nd' : 'rd'} Innings (current)` }] : []),
  ];

  if (allInnings.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400 text-sm">No innings data yet</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {allInnings.map(({ inn, label }) => (
        <InningsStats key={label} innings={inn} playerNames={playerNames} label={label} />
      ))}
    </div>
  );
}
