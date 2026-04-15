import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services';
import { motion } from 'framer-motion';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.register(form);
      navigate('/login', { state: { message: 'Account created! Please login.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
      <p className="text-gray-500 text-sm mb-6">Join the Athléon community</p>
      {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {['name', 'email', 'phone', 'password'].map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {field.charAt(0).toUpperCase() + field.slice(1)}
            </label>
            <input
              type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
              placeholder={`Enter your ${field}`}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              className="input"
              required
            />
          </div>
        ))}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full !py-3 disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating...
            </span>
          ) : 'Sign Up'}
        </button>
      </form>
    </motion.div>
  );
}
