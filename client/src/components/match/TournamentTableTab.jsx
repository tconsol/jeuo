import { useQuery } from '@tanstack/react-query';
import { FiAward, FiExternalLink } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

export default function TournamentTableTab({ tournament }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['tournament-standings', tournament._id],
    queryFn: () =>
      api.get(`/tournaments/${tournament._id}/standings`).then((r) => r.data.data.standings),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError || !data?.length) {
    return (
      <div className="p-8 text-center">
        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <FiAward size={24} className="text-gray-300" />
        </div>
        <p className="text-gray-400 font-medium text-sm">Standings not available yet</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Tournament link */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{tournament.name}</p>
        <Link
          to={`/tournaments/${tournament._id}`}
          className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
        >
          View <FiExternalLink size={11} />
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_32px_32px_32px_32px_48px] px-4 py-2.5 bg-gray-50/70 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider gap-2">
          <span>Team</span>
          <span className="text-center">P</span>
          <span className="text-center">W</span>
          <span className="text-center">L</span>
          <span className="text-center">D</span>
          <span className="text-right">Pts</span>
        </div>

        <div className="divide-y divide-gray-50">
          {data.map((row, i) => (
            <div
              key={row.name || i}
              className={`grid grid-cols-[1fr_32px_32px_32px_32px_48px] px-4 py-3 items-center gap-2 ${
                i === 0 ? 'bg-indigo-50/30' : ''
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${
                  i === 0 ? 'bg-amber-100 text-amber-700'
                  : i === 1 ? 'bg-gray-200 text-gray-600'
                  : i === 2 ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-100 text-gray-500'
                }`}>
                  {i + 1}
                </div>
                <span className="text-sm font-semibold text-gray-900 truncate">{row.name || '—'}</span>
              </div>
              <span className="text-sm tabular-nums text-gray-500 text-center">{row.played ?? 0}</span>
              <span className="text-sm tabular-nums text-emerald-600 font-semibold text-center">{row.won ?? 0}</span>
              <span className="text-sm tabular-nums text-red-500 font-semibold text-center">{row.lost ?? 0}</span>
              <span className="text-sm tabular-nums text-gray-400 text-center">{row.drawn ?? 0}</span>
              <span className="text-sm tabular-nums font-black text-indigo-700 text-right">{row.points ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-[10px] text-gray-300 mt-3">P = Played · W = Won · L = Lost · D = Draw · Pts = Points</p>
    </div>
  );
}
