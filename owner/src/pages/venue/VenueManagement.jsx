import { useQuery } from '@tanstack/react-query';
import { venueService } from '../../services';
import { StatusBadge, DataTable } from '../../components';
import { Link } from 'react-router-dom';

export default function VenueManagement() {
  const { data: venues, isLoading } = useQuery({
    queryKey: ['owner-venues'],
    queryFn: () => venueService.getAll().then((r) => r.data.data),
  });

  const columns = [
    { key: 'name', label: 'Venue Name' },
    { key: 'city', label: 'City', render: (_, row) => row.address?.city || ' ' },
    { key: 'sports', label: 'Sports', render: (v) => v?.join(', ') || ' ' },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'actions', label: '', render: (_, row) => (
      <Link to={`/venues/${row._id}/edit`} className="text-xs text-indigo-600 hover:underline" onClick={(e) => e.stopPropagation()}>
        Edit
      </Link>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Your Venues</h1>
        <Link to="/venues/new" className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
          + Add Venue
        </Link>
      </div>
      {isLoading ? <div className="animate-pulse h-60 bg-gray-100 rounded-xl" /> : <DataTable columns={columns} data={venues} />}
    </div>
  );
}
