function buildPlayerMap(match) {
  const map = {};
  [...(match?.teams?.home?.players || []), ...(match?.teams?.away?.players || [])].forEach((p) => {
    if (p?._id) map[p._id.toString()] = p.name || 'Player';
  });
  return map;
}

function InningsOvers({ innings, playerNames, label }) {
  const getName = (id) => (id ? playerNames[id.toString()] || 'Player' : '—');
  const history = innings?.overHistory || [];
  if (history.length === 0) return null;

  // Build cumulative score
  let cumRuns = 0, cumWickets = 0;
  const rows = history.map((ov, i) => {
    cumRuns += ov.runs || 0;
    cumWickets += ov.wickets || 0;
    return {
      over: i + 1,
      runs: ov.runs || 0,
      wickets: ov.wickets || 0,
      balls: ov.balls || 0,
      maiden: ov.maiden || false,
      bowler: ov.bowler,
      cumRuns,
      cumWickets,
      detail: ov.detail || [],
    };
  });

  const getBallLabel = (ball) => {
    if (!ball || typeof ball !== 'object') return { label: String(ball ?? ''), cls: 'bg-gray-100 text-gray-600' };
    if (ball.isWicket) return { label: 'W', cls: 'bg-red-100 text-red-700' };
    if (!ball.isLegalDelivery) {
      if (ball.extraType === 'wide')    return { label: 'Wd', cls: 'bg-amber-100 text-amber-700' };
      if (ball.extraType === 'no_ball') return { label: 'NB', cls: 'bg-amber-100 text-amber-700' };
    }
    if (ball.runs === 6) return { label: '6', cls: 'bg-purple-100 text-purple-700' };
    if (ball.runs === 4) return { label: '4', cls: 'bg-blue-100 text-blue-700' };
    if (ball.runs === 0) return { label: '·', cls: 'bg-gray-100 text-gray-400' };
    return { label: String(ball.runs), cls: 'bg-gray-100 text-gray-700' };
  };

  return (
    <div>
      <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 px-1">{label}</p>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[40px_1fr_48px_48px_80px] px-4 py-2.5 bg-gray-50/70 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider gap-2">
          <span>Ov</span>
          <span>Bowler</span>
          <span className="text-center">Runs</span>
          <span className="text-center">Wkts</span>
          <span className="text-right">Score</span>
        </div>

        {/* Over rows */}
        <div className="divide-y divide-gray-50">
          {rows.map((row) => (
            <div key={row.over} className={`${row.maiden ? 'bg-emerald-50/40' : ''}`}>
              <div className="grid grid-cols-[40px_1fr_48px_48px_80px] px-4 py-2.5 items-center gap-2">
                <span className="text-xs font-black text-gray-500 tabular-nums">{row.over}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{getName(row.bowler)}</p>
                  {row.maiden && (
                    <span className="text-[10px] text-emerald-600 font-bold">Maiden</span>
                  )}
                </div>
                <span className={`text-sm font-black tabular-nums text-center ${row.wickets > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {row.runs}
                </span>
                <span className="text-sm font-bold tabular-nums text-center text-gray-500">
                  {row.wickets > 0 ? <span className="text-red-600">{row.wickets}</span> : '—'}
                </span>
                <span className="text-xs font-bold tabular-nums text-right text-gray-700">
                  {row.cumRuns}/{row.cumWickets}
                </span>
              </div>

              {/* Ball-by-ball detail */}
              {row.detail.length > 0 && (
                <div className="px-4 pb-2.5 flex flex-wrap gap-1">
                  {row.detail.map((ball, bi) => {
                    const { label, cls } = getBallLabel(ball);
                    return (
                      <span
                        key={bi}
                        className={`w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center ${cls}`}
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary row */}
        <div className="px-4 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500">{history.length} overs</span>
          <span className="text-sm font-black text-gray-800 tabular-nums">
            {innings?.runs ?? 0}/{innings?.wickets ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CricketOversTab({ score, match }) {
  if (!score) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400 text-sm">Over data not available</p>
      </div>
    );
  }

  const playerNames = buildPlayerMap(match);
  const prevInnings = score.innings || [];
  const current     = score.currentInningsData;

  const allInnings = [
    ...prevInnings.map((inn, i) => ({ inn, label: `${i + 1}${i === 0 ? 'st' : 'nd'} Innings` })),
    ...(current ? [{ inn: current, label: `${prevInnings.length + 1}${prevInnings.length === 0 ? 'st' : prevInnings.length === 1 ? 'nd' : 'rd'} Innings` }] : []),
  ];

  const hasAny = allInnings.some(({ inn }) => (inn?.overHistory?.length ?? 0) > 0);

  if (!hasAny) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400 text-sm font-medium">No overs bowled yet</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      {allInnings.map(({ inn, label }) =>
        (inn?.overHistory?.length ?? 0) > 0 ? (
          <InningsOvers key={label} innings={inn} playerNames={playerNames} label={label} />
        ) : null
      )}
    </div>
  );
}
