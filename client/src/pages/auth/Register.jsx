import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';

const FIELDS = [
  { name: 'name', label: 'Full Name', icon: FiUser, type: 'text', placeholder: 'Enter your full name' },
  { name: 'email', label: 'Email', icon: FiMail, type: 'email', placeholder: 'you@example.com' },
  { name: 'phone', label: 'Phone (optional)', icon: FiPhone, type: 'tel', placeholder: '10-digit phone number', required: false },
  { name: 'password', label: 'Password', icon: FiLock, type: 'password', placeholder: 'Min 8 characters' },
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.register(form);
      navigate('/login', { state: { message: 'Account created successfully! Please sign in.' } });
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed');
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
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-1">Create Account</h1>
      <p className="text-gray-500 text-sm mb-6">Join the Athleon community</p>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {FIELDS.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
            <div className="relative">
              <field.icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type={field.name === 'password' ? (showPassword ? 'text' : 'password') : field.type}
                placeholder={field.placeholder}
                value={form[field.name]}
                onChange={(e) => {
                  let val = e.target.value;
                  if (field.name === 'phone') val = val.replace(/\D/g, '').slice(0, 10);
                  setForm({ ...form, [field.name]: val });
                }}
                className={`input !pl-10 ${field.name === 'password' ? '!pr-10' : ''}`}
                required={field.required !== false}
                minLength={field.name === 'password' ? 8 : undefined}
              />
              {field.name === 'password' && (
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              )}
            </div>
          </div>
        ))}
        <button type="submit" disabled={loading} className="btn-primary w-full !py-3 disabled:opacity-50">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating account...
            </span>
          ) : 'Sign Up'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link>
      </p>
    </motion.div>
  );
}
