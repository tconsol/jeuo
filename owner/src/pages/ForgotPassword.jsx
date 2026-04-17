import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';

const STEPS = ['Email', 'Verify OTP', 'New Password', 'Done'];

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

  // Step 0   send OTP
  const sendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      toast.success('OTP sent to your email');
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
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Reset Your<br />
            <span className="text-emerald-300">Password</span>
          </h1>
          <p className="text-white/70 mt-5 text-lg leading-relaxed max-w-sm">
            We'll send a secure OTP to your email to verify your identity and help you create a new password.
          </p>

          <div className="flex items-center gap-4 mt-10 p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
            {['Email', 'Verify OTP', 'New Password', 'Done'].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < step ? 'bg-emerald-400 text-white' : i === step ? 'bg-white text-emerald-700 ring-4 ring-white/30' : 'bg-white/20 text-white/50'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                {i < 3 && <div className={`w-6 h-0.5 ${i < step ? 'bg-emerald-400' : 'bg-white/20'}`} />}
              </div>
            ))}
          </div>
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
            {/* Progress dots (mobile) */}
            <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
              {STEPS.map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < step ? 'bg-emerald-600 text-white' : i === step ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-gray-200 text-gray-400'}`}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  {i < STEPS.length - 1 && <div className={`w-6 h-0.5 ${i < step ? 'bg-emerald-600' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>

            {/* Progress dots (desktop) */}
            <div className="hidden lg:flex items-center gap-2 mb-8">
              {STEPS.map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < step ? 'bg-emerald-600 text-white' : i === step ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-gray-200 text-gray-400'}`}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  {i < STEPS.length - 1 && <div className={`w-6 h-0.5 ${i < step ? 'bg-emerald-600' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>

            {step === 0 && (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Forgot Password?</h1>
                  <p className="text-sm text-gray-500 mt-1">Enter your registered email to receive a 6-digit OTP.</p>
                </div>
                <form onSubmit={sendOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                      required
                    />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                    {loading ? 'Sending OTP…' : 'Send OTP'}
                  </button>
                </form>
              </>
            )}

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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Enter OTP</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="• • • • • •"
                      maxLength={6}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                      required
                    />
                  </div>
                  <button type="submit" disabled={loading || otp.length !== 6}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                    {loading ? 'Verifying…' : 'Verify OTP'}
                  </button>
                  <button type="button" onClick={() => { setStep(0); setOtp(''); }}
                    className="w-full text-sm text-gray-500 hover:text-gray-700 py-1">
                    ← Change email
                  </button>
                </form>
              </>
            )}

            {step === 2 && (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Set New Password</h1>
                  <p className="text-sm text-gray-500 mt-1">Choose a strong password with at least 8 characters.</p>
                </div>
                <form onSubmit={resetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                    <div className="relative">
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-12 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                        required
                      />
                      <button type="button" onClick={() => setShowPwd((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium">
                        {showPwd ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                      required
                    />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                    {loading ? 'Resetting…' : 'Reset Password'}
                  </button>
                </form>
              </>
            )}

            {step === 3 && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Password Reset!</h1>
                <p className="text-sm text-gray-500">Your password has been updated. You can now sign in with your new password.</p>
                <button onClick={() => navigate('/login')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                  Sign In
                </button>
              </div>
            )}

            {step < 3 && (
              <p className="text-center text-sm text-gray-500 mt-6">
                <Link to="/login" className="text-emerald-600 font-medium hover:text-emerald-700">← Back to sign in</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
