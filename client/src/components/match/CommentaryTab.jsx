export default function CommentaryTab({ commentary = [] }) {
  const sorted = [...commentary].reverse();

  if (sorted.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-400 font-medium">No commentary yet</p>
        <p className="text-gray-300 text-xs mt-1">Commentary will appear here as the match progresses</p>
      </div>
    );
  }

  const typeConfig = {
    boundary: { rowBg: 'bg-blue-50',   badge: 'bg-blue-100 text-blue-700',   label: '4',     dot: 'bg-blue-400'   },
    six:      { rowBg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-700', label: '6',    dot: 'bg-purple-500' },
    wicket:   { rowBg: 'bg-red-50',    badge: 'bg-red-100 text-red-700',      label: 'W',     dot: 'bg-red-500'    },
    extra:    { rowBg: 'bg-amber-50',  badge: 'bg-amber-100 text-amber-700',  label: 'EXTRA', dot: 'bg-amber-400'  },
    milestone:{ rowBg: 'bg-emerald-50',badge: 'bg-emerald-100 text-emerald-700',label:'★',   dot: 'bg-emerald-500'},
    info:     { rowBg: 'bg-indigo-50', badge: 'bg-indigo-100 text-indigo-700', label: 'ℹ',   dot: 'bg-indigo-400' },
    normal:   { rowBg: 'bg-white',     badge: null,                           label: null,    dot: 'bg-gray-300'   },
  };

  return (
    <div className="divide-y divide-gray-50">
      {sorted.map((entry, i) => {
        const cfg = typeConfig[entry.type] || typeConfig.normal;
        return (
          <div key={i} className={`flex items-start gap-3 px-4 py-3.5 ${cfg.rowBg}`}>
            {/* Over number */}
            <div className="flex-shrink-0 w-10 pt-0.5 text-center">
              <span className="text-[11px] font-bold text-gray-400 font-mono">{entry.over || '—'}</span>
            </div>

            {/* Dot */}
            <div className="flex-shrink-0 mt-1.5">
              <span className={`w-2 h-2 rounded-full block ${cfg.dot}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {cfg.badge && (
                <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full mb-1 ${cfg.badge}`}>
                  {cfg.label}
                </span>
              )}
              <p className="text-sm text-gray-700 leading-relaxed">{entry.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
