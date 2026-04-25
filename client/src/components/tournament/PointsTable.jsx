import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';

/**
 * Points Table — sorted by points, then NRR (cricket), goal diff (football), etc.
 *
 * NRR formula (cricket):
 *   NRR = (Total runs scored / Total overs faced) − (Total runs conceded / Total overs bowled)
 *
 * If the server already computes NRR and sends it in standings, we just display it.
 * This component handles sorting + display only.
 */
export default function PointsTable({ standings = [], sport = 'cricket', tournament }) {
  const isCricket    = sport === 'cricket';
  const isFootball   = sport === 'football';
  const isVolleyball = sport === 'volleyball' || sport === 'badminton' || sport === 'table_tennis';

  const sorted = useMemo(() => {
    if (!standings.length) return [];
    return [...standings].sort((a, b) => {
      // 1. Points
      if (b.points !== a.points) return b.points - a.points;
      // 2. Sport-specific tiebreaker
      if (isCricket)    return (b.netRunRate   || 0) - (a.netRunRate   || 0);
      if (isFootball)   return (b.goalDifference || 0) - (a.goalDifference || 0);
      if (isVolleyball) return (b.setRatio      || 0) - (a.setRatio      || 0);
      // 3. Win rate
      const wrA = a.played > 0 ? a.won / a.played : 0;
      const wrB = b.played > 0 ? b.won / b.played : 0;
      return wrB - wrA;
    });
  }, [standings, sport]);

  if (!sorted.length) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
        <p className="text-gray-400 text-sm">No matches played yet — standings will appear here.</p>
      </div>
    );
  }

  const leader = sorted[0];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-indigo-600 to-purple-700 flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-white">Points Table</h3>
          <p className="text-white/60 text-xs mt-0.5">
            {sorted.length} teams · {tournament?.format?.replace(/_/g, ' ') || 'League'}
          </p>
        </div>
        <div className="text-right text-xs text-white/50">
          {isCricket    && 'Sorted by Pts → NRR'}
          {isFootball   && 'Sorted by Pts → GD'}
          {isVolleyball && 'Sorted by Pts → Set Ratio'}
          {!isCricket && !isFootball && !isVolleyball && 'Sorted by Pts → Win %'}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3 text-left font-semibold w-8">#</th>
              <th className="px-4 py-3 text-left font-semibold">Team</th>
              <th className="px-3 py-3 text-center font-semibold">P</th>
              <th className="px-3 py-3 text-center font-semibold">W</th>
              <th className="px-3 py-3 text-center font-semibold">L</th>
              <th className="px-3 py-3 text-center font-semibold">D</th>
              {isCricket    && <th className="px-3 py-3 text-center font-semibold">NRR</th>}
              {isFootball   && <th className="px-3 py-3 text-center font-semibold">GD</th>}
              {isVolleyball && <th className="px-3 py-3 text-center font-semibold">SR</th>}
              <th className="px-4 py-3 text-center font-semibold">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map((team, idx) => {
              const winRate = team.played > 0 ? ((team.won / team.played) * 100).toFixed(0) : 0;
              const isTop3  = idx < 3;
              const nrr     = team.netRunRate   || 0;
              const gd      = team.goalDifference || 0;
              const sr      = team.setRatio      || 0;

              const rowBg = idx === 0 ? 'bg-amber-50/60' :
                            idx === 1 ? 'bg-gray-50/60'  :
                            idx === 2 ? 'bg-orange-50/40': '';

              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;

              return (
                <motion.tr key={team._id || team.teamName || idx}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`transition hover:bg-indigo-50/30 ${rowBg}`}>

                  {/* Rank */}
                  <td className="px-4 py-3.5">
                    {medal ? (
                      <span className="text-base">{medal}</span>
                    ) : (
                      <span className="text-gray-400 font-bold text-sm">{idx + 1}</span>
                    )}
                  </td>

                  {/* Team name */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                        isTop3 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {(team.teamName || team.name || '?')[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{team.teamName || team.name}</p>
                        <p className="text-[10px] text-gray-400">{winRate}% win rate</p>
                      </div>
                    </div>
                  </td>

                  {/* P W L D */}
                  <td className="px-3 py-3.5 text-center text-gray-700 font-medium">{team.played || 0}</td>
                  <td className="px-3 py-3.5 text-center">
                    <span className="font-bold text-emerald-600">{team.won || 0}</span>
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <span className="font-bold text-red-500">{team.lost || 0}</span>
                  </td>
                  <td className="px-3 py-3.5 text-center text-gray-500">{team.drawn || 0}</td>

                  {/* Sport-specific */}
                  {isCricket && (
                    <td className="px-3 py-3.5 text-center">
                      <span className={`font-bold text-sm flex items-center justify-center gap-0.5 ${
                        nrr > 0 ? 'text-emerald-600' : nrr < 0 ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        {nrr > 0 ? <FiTrendingUp size={12} /> : nrr < 0 ? <FiTrendingDown size={12} /> : <FiMinus size={12} />}
                        {nrr >= 0 ? '+' : ''}{nrr.toFixed(3)}
                      </span>
                    </td>
                  )}
                  {isFootball && (
                    <td className="px-3 py-3.5 text-center">
                      <span className={`font-bold text-sm ${gd > 0 ? 'text-emerald-600' : gd < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {gd >= 0 ? '+' : ''}{gd}
                      </span>
                    </td>
                  )}
                  {isVolleyball && (
                    <td className="px-3 py-3.5 text-center">
                      <span className="font-bold text-sm text-gray-700">{sr.toFixed(2)}</span>
                    </td>
                  )}

                  {/* Points */}
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex items-center justify-center font-black text-sm px-3 py-1 rounded-xl ${
                      idx === 0 ? 'bg-amber-100 text-amber-700' :
                      isTop3    ? 'bg-indigo-100 text-indigo-700' :
                                  'bg-gray-100 text-gray-600'
                    }`}>
                      {team.points || 0}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
        {[
          ['P', 'Played'], ['W', 'Won'], ['L', 'Lost'], ['D', 'Drawn'],
          ...(isCricket    ? [['NRR', 'Net Run Rate = (Runs Scored / Overs Faced) − (Runs Conceded / Overs Bowled)']] : []),
          ...(isFootball   ? [['GD',  'Goal Difference']] : []),
          ...(isVolleyball ? [['SR',  'Set Ratio']] : []),
          ['Pts', 'Points'],
        ].map(([abbr, desc]) => (
          <span key={abbr}><b className="text-gray-700">{abbr}</b> = {desc}</span>
        ))}
      </div>
    </motion.div>
  );
}
