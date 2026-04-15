import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services';
import { motion } from 'framer-motion';
import { FiMail, FiShield, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiCheck } from 'react-icons/fi';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=new password, 4=success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.forgotPassword(email);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await authService.verifyResetOtp(email, otp);
      setResetToken(data.data.resetToken);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.resetPassword(email, resetToken, newPassword);
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-8 shadow-soft border border-gray-100"
    >
      {/* Progress dots */}
      {step < 4 && (
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`w-2.5 h-2.5 rounded-full transition-all ${s === step ? 'bg-primary-600 scale-110' : s < step ? 'bg-primary-300' : 'bg-gray-200'}`} />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>
      )}

      {step === 1 && (
        <>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 text-primary-600 rounded-xl mb-3">
              <FiMail size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Forgot Password</h2>
            <p className="text-gray-500 text-sm mt-1">Enter your email to receive a verification code</p>
          </div>
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="relative">
              <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="input !pl-10"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full !py-3 disabled:opacity-50">
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 text-primary-600 rounded-xl mb-3">
              <FiShield size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Verify Code</h2>
            <p className="text-gray-500 text-sm mt-1">We sent a 6-digit code to <span className="font-medium text-gray-700">{email}</span></p>
          </div>
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="input text-center text-2xl tracking-[0.5em] font-mono"
              required
              maxLength={6}
              autoFocus
            />
            <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full !py-3 disabled:opacity-50">
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            <button type="button" onClick={() => { setStep(1); setOtp(''); }} className="btn-ghost w-full text-sm">
              Change email
            </button>
          </form>
        </>
      )}

      {step === 3 && (
        <>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 text-primary-600 rounded-xl mb-3">
              <FiLock size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">New Password</h2>
            <p className="text-gray-500 text-sm mt-1">Create a strong password for your account</p>
          </div>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="relative">
              <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 8 characters)"
                className="input !pl-10 !pr-10"
                required
                minLength={8}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="input !pl-10"
                required
                minLength={8}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full !py-3 disabled:opacity-50">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </>
      )}

      {step === 4 && (
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 text-green-600 rounded-full mb-4">
            <FiCheck size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Password Reset!</h2>
          <p className="text-gray-500 text-sm mb-6">Your password has been changed successfully. You can now sign in with your new password.</p>
          <button onClick={() => navigate('/login')} className="btn-primary w-full !py-3">
            Sign In
          </button>
        </div>
      )}

      {step < 4 && (
        <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mt-6">
          <FiArrowLeft size={14} />
          Back to login
        </Link>
      )}
    </motion.div>
  );
}
