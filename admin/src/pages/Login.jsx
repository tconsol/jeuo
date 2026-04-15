import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('password');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
      if (user?.role !== 'admin') {
        toast.error('Access denied. Admin account required.');
        return;
      }
      localStorage.setItem('admin_token', data.data?.tokens?.accessToken || data.accessToken);
      localStorage.setItem('admin_refreshToken', data.data?.tokens?.refreshToken || data.refreshToken);
      toast.success(`Welcome, ${user.name}!`);
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
      toast.success(import.meta.env.DEV ? 'Dev OTP: 123456' : 'OTP sent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
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
      if (user?.role !== 'admin') {
        toast.error('Access denied. Admin account required.');
        return;
      }
      localStorage.setItem('admin_token', data.data?.tokens?.accessToken || data.accessToken);
      localStorage.setItem('admin_refreshToken', data.data?.tokens?.refreshToken || data.refreshToken);
      toast.success('Logged in!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Panel</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in with your admin credentials</p>

        <div className="flex rounded-lg bg-gray-100 p-1 mb-6 gap-1">
          <button
            onClick={() => setMode('password')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
              mode === 'password' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Email & Password
          </button>
          <button
            onClick={() => setMode('otp')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
              mode === 'otp' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Phone OTP
          </button>
        </div>

        {mode === 'password' ? (
          <form onSubmit={loginWithPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@athleon.in"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            {import.meta.env.DEV && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                <p className="font-semibold mb-1">Dev credentials</p>
                <p>admin@athleon.in — Password@123</p>
              </div>
            )}
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-primary-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        ) : (
          otpStep === 'phone' ? (
            <form onSubmit={sendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9000000001"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              {import.meta.env.DEV && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  Dev mode — OTP will be <strong>123456</strong>
                </p>
              )}
              <button type="submit" disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
                {loading ? 'Sending…' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center tracking-widest text-lg outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
                {loading ? 'Verifying…' : 'Verify & Sign In'}
              </button>
              <button type="button" onClick={() => setOtpStep('phone')}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-2">
                ← Change number
              </button>
            </form>
          )
        )}
      </div>
    </div>
  );
}

