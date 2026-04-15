export default function StatusBadge({ status }) {
  const colors = {
    active: 'bg-green-100 text-green-700',
    banned: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    resolved: 'bg-blue-100 text-blue-700',
    open: 'bg-orange-100 text-orange-700',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}
