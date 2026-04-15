import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';

const SPORTS = ['cricket', 'football', 'basketball', 'tennis', 'badminton', 'table_tennis', 'volleyball'];
const AMENITIES = ['parking', 'changing_rooms', 'showers', 'drinking_water', 'floodlights', 'first_aid', 'cafeteria', 'wifi'];

export default function VenueForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '', description: '', phone: '',
    address: { line1: '', city: '', state: '', pincode: '' },
    sports: [],
    amenities: [],
    courts: [{ name: 'Court 1', sport: 'cricket', pricePerSlot: 500, slots: [] }],
  });
  const [loading, setLoading] = useState(false);

  const { data } = useQuery({
    queryKey: ['venue', id],
    queryFn: () => api.get(`/venues/${id}`).then((r) => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (data?.venue) {
      const v = data.venue;
      setForm({
        name: v.name || '', description: v.description || '', phone: v.phone || '',
        address: v.address || { line1: '', city: '', state: '', pincode: '' },
        sports: v.sports || [],
        amenities: v.amenities || [],
        courts: v.courts?.length ? v.courts : [{ name: 'Court 1', sport: 'cricket', pricePerSlot: 500, slots: [] }],
      });
    }
  }, [data]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const toggleArray = (key, val) => {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter((v) => v !== val) : [...f[key], val],
    }));
  };

  const updateCourt = (idx, field, value) => {
    setForm((f) => {
      const courts = [...f.courts];
      courts[idx] = { ...courts[idx], [field]: value };
      return { ...f, courts };
    });
  };

  const addCourt = () => {
    setForm((f) => ({
      ...f,
      courts: [...f.courts, { name: `Court ${f.courts.length + 1}`, sport: 'cricket', pricePerSlot: 500, slots: [] }],
    }));
  };

  const removeCourt = (idx) => {
    setForm((f) => ({ ...f, courts: f.courts.filter((_, i) => i !== idx) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/venues/${id}`, form);
        toast.success('Venue updated');
      } else {
        await api.post('/venues', form);
        toast.success('Venue created');
      }
      navigate('/venues');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save venue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{isEdit ? 'Edit Venue' : 'Add New Venue'}</h1>

      <form onSubmit={submit} className="space-y-6">
        {/* Basic info */}
        <div className="card space-y-4">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Basic Info</h2>
          <input value={form.name} onChange={(e) => set('name', e.target.value)}
            placeholder="Venue name" className="input" required />
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
            placeholder="Description" className="input" rows={3} />
          <input value={form.phone} onChange={(e) => set('phone', e.target.value)}
            placeholder="Contact phone" className="input" />
        </div>

        {/* Address */}
        <div className="card space-y-4">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Address</h2>
          <input value={form.address.line1} onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, line1: e.target.value } }))}
            placeholder="Address line" className="input" required />
          <div className="grid grid-cols-2 gap-3">
            <input value={form.address.city} onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, city: e.target.value } }))}
              placeholder="City" className="input" required />
            <input value={form.address.state} onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, state: e.target.value } }))}
              placeholder="State" className="input" required />
          </div>
          <input value={form.address.pincode} onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, pincode: e.target.value } }))}
            placeholder="Pincode" className="input w-1/2" required />
        </div>

        {/* Sports */}
        <div className="card">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Sports</h2>
          <div className="flex flex-wrap gap-2">
            {SPORTS.map((s) => (
              <button key={s} type="button" onClick={() => toggleArray('sports', s)}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize transition ${
                  form.sports.includes(s) ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>{s.replace('_', ' ')}</button>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div className="card">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => (
              <button key={a} type="button" onClick={() => toggleArray('amenities', a)}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize transition ${
                  form.amenities.includes(a) ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>{a.replace(/_/g, ' ')}</button>
            ))}
          </div>
        </div>

        {/* Courts */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Courts</h2>
            <button type="button" onClick={addCourt} className="text-sm text-primary-600 hover:text-primary-700">+ Add Court</button>
          </div>
          {form.courts.map((court, idx) => (
            <div key={idx} className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Court {idx + 1}</span>
                {form.courts.length > 1 && (
                  <button type="button" onClick={() => removeCourt(idx)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input value={court.name} onChange={(e) => updateCourt(idx, 'name', e.target.value)}
                  placeholder="Name" className="input" />
                <select value={court.sport} onChange={(e) => updateCourt(idx, 'sport', e.target.value)}
                  className="input capitalize">
                  {SPORTS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
                <input type="number" value={court.pricePerSlot} onChange={(e) => updateCourt(idx, 'pricePerSlot', Number(e.target.value))}
                  placeholder="₹ per slot" className="input" min={0} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? 'Saving…' : isEdit ? 'Update Venue' : 'Create Venue'}
          </button>
          <button type="button" onClick={() => navigate('/venues')} className="btn-ghost">Cancel</button>
        </div>
      </form>
    </div>
  );
}
