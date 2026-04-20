import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import CustomSelect from '../components/CustomSelect';

const SPORTS = ['cricket', 'football', 'basketball', 'tennis', 'badminton', 'table_tennis', 'volleyball'];
const SPORT_OPTIONS = SPORTS.map((s) => ({ value: s, label: s.replace('_', ' ') }));
const AMENITIES = ['parking', 'changing_rooms', 'showers', 'drinking_water', 'floodlights', 'first_aid', 'cafeteria', 'wifi'];

export default function VenueForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '', description: '', phone: '',
    location: { address: '', city: '', state: '', pincode: '', type: 'Point', coordinates: [77.5946, 12.9716] },
    sports: [],
    amenities: [],
    courts: [{ name: 'Court 1', sport: 'cricket', pricePerSlot: 500, slots: [] }],
  });
  const [loading, setLoading] = useState(false);

  const { data } = useQuery({
    queryKey: ['venue', id],
    queryFn: () => api.get(`/venues/${id}`).then((r) => r.data.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (data?.venue) {
      const v = data.venue;
      setForm({
        name: v.name || '', description: v.description || '', phone: v.phone || '',
        location: v.location || { address: '', city: '', state: '', pincode: '', type: 'Point', coordinates: [77.5946, 12.9716] },
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Venue' : 'Add New Venue'}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{isEdit ? 'Update your venue details' : 'Fill in the details to list your venue'}</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* Basic info */}
        <div className="bg-white rounded-2xl border border-gray-200/60 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Basic Info</h2>
          <input value={form.name} onChange={(e) => set('name', e.target.value)}
            placeholder="Venue name" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition" required />
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
            placeholder="Description" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition" rows={3} />
          <input value={form.phone} onChange={(e) => set('phone', e.target.value)}
            placeholder="Contact phone" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition" />
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl border border-gray-200/60 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Location</h2>
          <input value={form.location.address} onChange={(e) => setForm((f) => ({ ...f, location: { ...f.location, address: e.target.value } }))}
            placeholder="Street address" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition" required />
          <div className="grid grid-cols-2 gap-3">
            <input value={form.location.city} onChange={(e) => setForm((f) => ({ ...f, location: { ...f.location, city: e.target.value } }))}
              placeholder="City" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition" required />
            <input value={form.location.state} onChange={(e) => setForm((f) => ({ ...f, location: { ...f.location, state: e.target.value } }))}
              placeholder="State" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition" required />
          </div>
          <input value={form.location.pincode} onChange={(e) => setForm((f) => ({ ...f, location: { ...f.location, pincode: e.target.value } }))}
            placeholder="Pincode" className="w-1/2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition" required />
        </div>

        {/* Sports */}
        <div className="bg-white rounded-2xl border border-gray-200/60 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Sports</h2>
          <div className="flex flex-wrap gap-2">
            {SPORTS.map((s) => (
              <button key={s} type="button" onClick={() => toggleArray('sports', s)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${
                  form.sports.includes(s) ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                }`}>{s.replace('_', ' ')}</button>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-white rounded-2xl border border-gray-200/60 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => (
              <button key={a} type="button" onClick={() => toggleArray('amenities', a)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${
                  form.amenities.includes(a) ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                }`}>{a.replace(/_/g, ' ')}</button>
            ))}
          </div>
        </div>

        {/* Courts */}
        <div className="bg-white rounded-2xl border border-gray-200/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Courts</h2>
            <button type="button" onClick={addCourt} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition">+ Add Court</button>
          </div>
          {form.courts.map((court, idx) => (
            <div key={idx} className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Court {idx + 1}</span>
                {form.courts.length > 1 && (
                  <button type="button" onClick={() => removeCourt(idx)} className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition">Remove</button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input value={court.name} onChange={(e) => updateCourt(idx, 'name', e.target.value)}
                  placeholder="Name" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition" />
                <CustomSelect
                  options={SPORT_OPTIONS}
                  value={court.sport}
                  onChange={(v) => updateCourt(idx, 'sport', v)}
                />
                <input type="number" value={court.pricePerSlot} onChange={(e) => updateCourt(idx, 'pricePerSlot', Number(e.target.value))}
                  placeholder="₹ per slot" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition" min={0} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-xl shadow-sm disabled:opacity-50 transition">
            {loading ? 'Saving…' : isEdit ? 'Update Venue' : 'Create Venue'}
          </button>
          <button type="button" onClick={() => navigate('/venues')}
            className="px-6 py-2.5 text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 text-sm font-medium rounded-xl transition">Cancel</button>
        </div>
      </form>
    </div>
  );
}
