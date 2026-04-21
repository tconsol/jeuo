import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { sendOtp, verifyOtp, clearError, loginWithEmail, loginWithGoogle } from '../store/slices/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPhone, FiShield, FiMail, FiLock, FiUser, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'phone', label: 'Phone', icon: FiPhone },
  { id: 'email', label: 'Email', icon: FiMail },
];

export default function Login() {
  const [activeTab, setActiveTab] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { otpSent, isLoading, error } = useSelector((s) => s.auth);
  const from = location.state?.from?.pathname || '/';
  const successMsg = location.state?.message;

  // Handle resend countdown timer
  useEffect(() => {
    if (!otpSent) {
      setResendCountdown(0);
      return;
    }

    if (resendCountdown <= 0) return;

    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCountdown, otpSent]);

  // Start countdown when OTP is sent
  useEffect(() => {
    if (otpSent) {
      setResendCountdown(30);
    }
  }, [otpSent]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const result = await dispatch(sendOtp(phone));
    if (!result.error) {
      dispatch(clearError());
      setResendCountdown(30);
    }
  };

  const handleResendOtp = async () => {
    const result = await dispatch(sendOtp(phone));
    if (!result.error) {
      setOtp('');
      setResendCountdown(30);
      toast.success('OTP resent to your phone');
    }
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
      // Dynamically load Google Identity Services script then init
      const existing = document.getElementById('google-gis-script');
      if (existing) { existing.addEventListener('load', initAndPrompt); return; }
      const script = document.createElement('script');
      script.id = 'google-gis-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initAndPrompt;
      script.onerror = () => toast.error('Google sign-in unavailable. Please use email login.');
      document.head.appendChild(script);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-8 shadow-soft border border-gray-100"
    >
      <h2 className="text-2xl font-display font-bold text-gray-900 mb-1">Welcome back</h2>
      <p className="text-gray-500 text-sm mb-6">Sign in to continue to Athleon</p>

      {successMsg && (
        <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); dispatch(clearError()); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'phone' && (
          <motion.div key="phone" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <div className="flex gap-2">
                    <span className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm font-medium">+91</span>
                    <div className="relative flex-1">
                      <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Enter your phone number"
                        className="input !pl-10"
                        required
                        maxLength={10}
                        pattern="[0-9]{10}"
                      />
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={isLoading || phone.length !== 10} className="btn-primary w-full !py-3 disabled:opacity-50">
                  {isLoading ? <Spinner text="Sending..." /> : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-primary-50 text-primary-700 rounded-xl text-sm">
                  <FiShield size={16} />
                  OTP sent to +91 {phone}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Verification Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    className="input text-center text-2xl tracking-[0.5em] font-mono"
                    required
                    maxLength={6}
                    autoFocus
                  />
                </div>
                <button type="submit" disabled={isLoading || otp.length !== 6} className="btn-primary w-full !py-3 disabled:opacity-50">
                  {isLoading ? <Spinner text="Verifying..." /> : 'Verify & Sign In'}
                </button>

                {/* Resend OTP Section */}
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={handleResendOtp} 
                    disabled={resendCountdown > 0 || isLoading}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend OTP'}
                  </button>
                  <button type="button" onClick={() => window.location.reload()} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all">
                    Change Number
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}

        {activeTab === 'email' && (
          <motion.div key="email" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input !pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <Link to="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="input !pl-10 !pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="btn-primary w-full !py-3 disabled:opacity-50">
                {isLoading ? <Spinner text="Signing in..." /> : 'Sign In'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
        <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400 uppercase">or</span></div>
      </div>

      {/* Google Button */}
      <button
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>

      {/* Register link */}
      <p className="text-center text-sm text-gray-500 mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
          Sign up
        </Link>
      </p>
    </motion.div>
  );
}

function Spinner({ text }) {
  return (
    <span className="flex items-center justify-center gap-2">
      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      {text}
    </span>
  );
}
