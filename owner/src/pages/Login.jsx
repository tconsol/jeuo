import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('password'); // 'password' | 'otp'

  // email+password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // otp state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState('phone');

  const [loading, setLoading] = useState(false);

  const loginWithPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const user = data.data?.user || data.user;
      if (user?.role !== 'owner' && user?.role !== 'admin') {
        toast.error('Access denied. Owner account required.');
        return;
      }
      localStorage.setItem('token', data.data?.tokens?.accessToken || data.accessToken);
      localStorage.setItem('refreshToken', data.data?.tokens?.refreshToken || data.refreshToken);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { phone });
      setOtpStep('otp');
      toast.success(process.env.NODE_ENV === 'development' ? 'OTP: 123456' : 'OTP sent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { phone, otp });
      const user = data.data?.user || data.user;
      if (user?.role !== 'owner' && user?.role !== 'admin') {
        toast.error('Access denied. Owner account required.');
        return;
      }
      localStorage.setItem('token', data.data?.tokens?.accessToken || data.accessToken);
      localStorage.setItem('refreshToken', data.data?.tokens?.refreshToken || data.refreshToken);
      toast.success('Logged in!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const FEATURES = ['Real-time booking management', 'Revenue analytics & reports', 'Multi-venue dashboard', 'Instant payouts'];

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel (emerald) ───────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 p-12">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-teal-400/20 rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-400/20 rounded-full" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <span className="text-white text-xl font-bold">A</span>
          </div>
          <div>
            <span className="text-xl font-bold text-white">Athléon</span>
            <span className="text-emerald-300 text-sm font-medium ml-2">Owners</span>
          </div>
        </div>

        {/* Tagline */}
        <div className="flex-1 flex flex-col justify-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 rounded-full text-xs font-medium text-white/90 mb-6 w-fit">
            <span className="text-lg">🏟️</span> Venue Management Platform
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
            Manage Venues.<br />
            Track Bookings.<br />
            <span className="text-emerald-300">Grow Revenue.</span>
          </h1>
          <p className="text-white/70 mt-5 text-lg leading-relaxed max-w-sm">
            List your sports facilities, accept real-time bookings, and track earnings   all from one dashboard.
          </p>

          <div className="flex flex-col gap-3 mt-8">
            {FEATURES.map((f) => (
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

        {/* Stats */}
        <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-2xl p-5">
          <p className="text-white/80 text-sm font-medium mb-3">Trusted by venue owners across India</p>
          <div className="flex gap-8">
            {[['500+', 'Venues'], ['50K+', 'Bookings'], ['₹2Cr+', 'Processed']].map(([val, lbl]) => (
              <div key={lbl}>
                <p className="text-2xl font-bold text-white">{val}</p>
                <p className="text-xs text-white/60 mt-0.5">{lbl}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel (form) ─────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-gray-50 lg:bg-white overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 p-6 pb-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-white font-bold">A</span>
          </div>
          <span className="text-xl font-bold text-emerald-700">Athléon Owners</span>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Owner Portal</h1>
              <p className="text-sm text-gray-500 mt-1">Sign in to manage your venues</p>
            </div>

            {/* Tab switcher */}
            <div className="flex rounded-xl bg-gray-100 p-1 mb-6 gap-1">
              <button
                onClick={() => setMode('password')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'password' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Email & Password
              </button>
              <button
                onClick={() => setMode('otp')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'otp' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Phone OTP
              </button>
            </div>

            {mode === 'password' ? (
              <form onSubmit={loginWithPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@example.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                    required
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <Link to="/forgot-password" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Forgot password?</Link>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                    required
                  />
                </div>
                {import.meta.env.DEV && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                    <p className="font-semibold mb-1">Dev credentials</p>
                    <p>owner1@athleon.in   Password@123</p>
                    <p>owner2@athleon.in   Password@123</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors shadow-sm shadow-emerald-500/20"
                >
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>
            ) : otpStep === 'phone' ? (
              <form onSubmit={sendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9000000002"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                    required
                  />
                </div>
                {import.meta.env.DEV && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    Dev mode   OTP will be <strong>123456</strong>
                  </p>
                )}
                <button type="submit" disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                  {loading ? 'Sending…' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Enter OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="• • • • • •"
                    maxLength={6}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-center tracking-[0.5em] text-xl font-mono outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                    required
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                  {loading ? 'Verifying…' : 'Verify & Sign In'}
                </button>
                <button type="button" onClick={() => setOtpStep('phone')}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 py-2">
                  ← Change number
                </button>
              </form>
            )}

            <p className="text-center text-sm text-gray-500 mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-emerald-600 font-medium hover:text-emerald-700">Register as Owner</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

