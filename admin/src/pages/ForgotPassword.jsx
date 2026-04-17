import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';

const STEPS = ['Email', 'Verify OTP', 'New Password', 'Done'];

const STEP_INFO = [
  { icon: '📧', title: 'Enter Email', desc: 'We\'ll send a reset OTP to your inbox' },
  { icon: '🔑', title: 'Verify OTP', desc: 'Check your email for the 6-digit code' },
  { icon: '🔒', title: 'New Password', desc: 'Choose a strong new password' },
  { icon: '✅', title: 'All Done', desc: 'Your password has been reset' },
];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  // Step 0   send OTP to registered email
  const sendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      toast.success('OTP sent to your registered email');
      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 1   verify OTP
  const verifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error('Enter the 6-digit OTP'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-reset-otp', { email: email.trim().toLowerCase(), otp });
      setResetToken(data.data?.resetToken || '');
      toast.success('OTP verified!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2   reset password
  const resetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        resetToken,
        newPassword: password,
      });
      toast.success('Password reset successfully!');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-900">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/2 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col h-full px-12 py-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center font-bold text-white text-lg">A</div>
            <span className="text-white font-bold text-xl tracking-tight">Athléon Admin</span>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center text-3xl mb-6">
              🔐
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Reset your password</h1>
            <p className="text-blue-200 leading-relaxed mb-8">
              Follow the simple steps to securely reset your admin account password.
            </p>

            {/* Step progress on left panel */}
            <div className="space-y-3">
              {STEP_INFO.map((s, i) => (
                <div
                  key={s.title}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                    i === step
                      ? 'bg-white/15 backdrop-blur'
                      : i < step
                      ? 'opacity-60'
                      : 'opacity-30'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    i < step
                      ? 'bg-blue-300 text-blue-900'
                      : i === step
                      ? 'bg-white text-blue-700'
                      : 'bg-white/20 text-white'
                  }`}>
                    {i < step ? '✓' : s.icon}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{s.title}</p>
                    <p className="text-blue-200 text-xs">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-blue-300 text-xs">© 2025 Athléon Platform</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col bg-gray-50 lg:bg-white overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-white">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm">A</div>
          <span className="font-bold text-gray-900">Athléon Admin</span>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">
            {/* Back link */}
            <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
              ← Back to sign in
            </Link>

            {/* Mobile progress dots */}
            <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
              {STEPS.map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i < step ? 'bg-blue-600 text-white' : i === step ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-6 h-0.5 ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>

        {/* Step 0   Enter email */}
        {step === 0 && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Forgot Password?</h1>
              <p className="text-sm text-gray-500 mt-1">
                Enter your admin email address. We'll send a 6-digit OTP to reset your password.
              </p>
            </div>
            <form onSubmit={sendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@athleon.in"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                {loading ? 'Sending OTP…' : 'Send OTP →'}
              </button>
            </form>
          </>
        )}

        {/* Step 1   Enter OTP */}
        {step === 1 && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
              <p className="text-sm text-gray-500 mt-1">
                We sent a 6-digit OTP to <strong className="text-gray-700">{email}</strong>. It expires in 10 minutes.
              </p>
            </div>
            <form onSubmit={verifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  maxLength={6}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                {loading ? 'Verifying…' : 'Verify OTP →'}
              </button>
              <button
                type="button"
                onClick={() => { setStep(0); setOtp(''); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-1"
              >
                ← Change email
              </button>
            </form>
          </>
        )}

        {/* Step 2   New password */}
        {step === 2 && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Set New Password</h1>
              <p className="text-sm text-gray-500 mt-1">Choose a strong password with at least 8 characters.</p>
            </div>
            <form onSubmit={resetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pr-12 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                {loading ? 'Resetting…' : 'Reset Password →'}
              </button>
            </form>
          </>
        )}

        {/* Step 3   Success */}
        {step === 3 && (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-4xl">
              ✅
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Password Reset!</h1>
            <p className="text-sm text-gray-500">Your admin password has been updated successfully.</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              Sign In →
            </button>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
