import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        role: 'owner',
      });
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel (emerald) ───────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 p-12">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-teal-400/20 rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-400/20 rounded-full" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <span className="text-white text-xl font-bold">A</span>
          </div>
          <div>
            <span className="text-xl font-bold text-white">Athléon</span>
            <span className="text-emerald-300 text-sm font-medium ml-2">Owners</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 rounded-full text-xs font-medium text-white/90 mb-6 w-fit">
            <span className="text-lg">🏟️</span> Join 500+ venue owners
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
            Start Earning<br />
            From Your<br />
            <span className="text-emerald-300">Sports Venue.</span>
          </h1>
          <p className="text-white/70 mt-5 text-lg leading-relaxed max-w-sm">
            Register your venue in under 5 minutes and start accepting bookings today.
          </p>

          <div className="flex flex-col gap-3 mt-8">
            {['Free to list your venue', 'Get bookings instantly', 'Secure, fast payouts', 'Detailed performance reports'].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-400/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-white/80 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-2xl p-5">
          <p className="text-white/80 text-sm italic">"Athléon helped me fill 90% of my slots within the first week."</p>
          <p className="text-white/50 text-xs mt-2">  Venue Owner, Bengaluru</p>
        </div>
      </div>

      {/* ── Right panel (form) ─────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-gray-50 lg:bg-white overflow-y-auto">
        <div className="lg:hidden flex items-center gap-3 p-6 pb-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-white font-bold">A</span>
          </div>
          <span className="text-xl font-bold text-emerald-700">Athléon Owners</span>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Create Owner Account</h1>
              <p className="text-sm text-gray-500 mt-1">Register to list and manage your venues</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="Rajesh Kumar"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@example.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  placeholder="9876543210"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Min. 8 characters"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-12 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium"
                  >
                    {showPwd ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={set('confirm')}
                  placeholder="Re-enter password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors shadow-sm shadow-emerald-500/20 mt-2"
              >
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-600 font-medium hover:text-emerald-700">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
