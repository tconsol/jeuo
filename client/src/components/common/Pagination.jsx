export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);

  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 text-sm rounded-lg disabled:opacity-40 hover:bg-gray-100"
      >
        Prev
      </button>
      {start > 1 && <span className="px-2 text-gray-400">…</span>}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`px-3 py-1.5 text-sm rounded-lg ${p === page ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
        >
          {p}
        </button>
      ))}
      {end < totalPages && <span className="px-2 text-gray-400">…</span>}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 text-sm rounded-lg disabled:opacity-40 hover:bg-gray-100"
      >
        Next
      </button>
    </div>
  );
}
