import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { sendOtp, verifyOtp, clearError, loginWithEmail, loginWithGoogle } from '../store/slices/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPhone, FiShield, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'phone', label: 'Phone', icon: FiPhone },
  { id: 'email', label: 'Email', icon: FiMail },
];

function Spinner({ text }) {
  return (
    <span className="flex items-center justify-center gap-2">
      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      {text}
    </span>
  );
}

export default function Login() {
  const [activeTab, setActiveTab] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp]   = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { otpSent, isLoading, error } = useSelector((s) => s.auth);
  const from       = location.state?.from?.pathname || '/';
  const successMsg = location.state?.message;

  useEffect(() => {
    if (!otpSent) { setResendCountdown(0); return; }
    if (resendCountdown <= 0) return;
    const t = setInterval(() => setResendCountdown((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [resendCountdown, otpSent]);

  useEffect(() => { if (otpSent) setResendCountdown(30); }, [otpSent]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const result = await dispatch(sendOtp(phone));
    if (!result.error) { dispatch(clearError()); setResendCountdown(30); }
  };

  const handleResendOtp = async () => {
    const result = await dispatch(sendOtp(phone));
    if (!result.error) { setOtp(''); setResendCountdown(30); toast.success('OTP resent'); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const result = await dispatch(verifyOtp({ phone, otp }));
    if (!result.error) navigate(from, { replace: true });
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginWithEmail({ email, password }));
    if (!result.error) navigate(from, { replace: true });
  };

  const handleGoogleLogin = () => {
    const initAndPrompt = () => {
      window.google.accounts.id.initialize({
        client_id: '64307221061-gp5vf0jn1uetebhu29hma5g3egv7dcfi.apps.googleusercontent.com',
        callback: async (response) => {
          const result = await dispatch(loginWithGoogle(response.credential));
          if (!result.error) navigate(from, { replace: true });
        },
      });
      window.google.accounts.id.prompt();
    };
    if (window.google?.accounts?.id) {
      initAndPrompt();
    } else {
      const existing = document.getElementById('google-gis-script');
      if (existing) { existing.addEventListener('load', initAndPrompt); return; }
      const script = document.createElement('script');
      script.id = 'google-gis-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true; script.defer = true;
      script.onload = initAndPrompt;
      script.onerror = () => toast.error('Google sign-in unavailable.');
      document.head.appendChild(script);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="w-full">

      {/* Brand */}
      <div className="text-center mb-7">
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-200">
          <span className="text-2xl">🏟️</span>
        </div>
        <h2 className="text-2xl font-black text-gray-900">Welcome back</h2>
        <p className="text-gray-400 text-sm mt-1">Sign in to continue to Athleon</p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-2xl mb-4 text-sm font-medium">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex bg-gray-100 rounded-2xl p-1.5 mb-6 gap-1">
        {TABS.map((tab) => (
          <button key={tab.id}
            onClick={() => { setActiveTab(tab.id); dispatch(clearError()); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'phone' && (
          <motion.div key="phone" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                  <div className="flex gap-2">
                    <span className="flex items-center px-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm font-bold">+91</span>
                    <div className="relative flex-1">
                      <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                      <input
                        type="tel" value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10-digit number"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        required maxLength={10} pattern="[0-9]{10}"
                      />
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={isLoading || phone.length !== 10}
                  className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-200">
                  {isLoading ? <Spinner text="Sending…" /> : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="flex items-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-700 rounded-2xl text-sm font-medium">
                  <FiShield size={15} /> OTP sent to +91 {phone}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Verification Code</label>
                  <input
                    type="text" value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="• • • • • •"
                    className="w-full px-4 py-4 border border-gray-200 rounded-2xl text-center text-2xl tracking-[0.6em] font-black focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    required maxLength={6} autoFocus
                  />
                </div>
                <button type="submit" disabled={isLoading || otp.length !== 6}
                  className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-200">
                  {isLoading ? <Spinner text="Verifying…" /> : 'Verify & Sign In'}
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={handleResendOtp} disabled={resendCountdown > 0 || isLoading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition">
                    {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend OTP'}
                  </button>
                  <button type="button" onClick={() => window.location.reload()}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                    Change Number
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}

        {activeTab === 'email' && (
          <motion.div key="email" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    required />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                  <Link to="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <input type={showPassword ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    required minLength={8} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                    {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-200">
                {isLoading ? <Spinner text="Signing in…" /> : 'Sign In'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
        <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400 font-semibold uppercase">or</span></div>
      </div>

      {/* Google */}
      <button onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border border-gray-200 rounded-2xl font-semibold text-gray-700 text-sm hover:bg-gray-50 hover:shadow-sm transition-all">
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>

      <p className="text-center text-sm text-gray-400 mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-bold">Sign up</Link>
      </p>
    </motion.div>
  );
}
