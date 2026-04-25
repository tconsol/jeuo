import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiArrowLeft } from 'react-icons/fi';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">

      {/* Big 404 */}
      <div className="relative mb-6">
        <p className="text-[120px] font-black leading-none bg-gradient-to-br from-indigo-200 to-purple-300 bg-clip-text text-transparent select-none">
          404
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center">
            <span className="text-4xl">🏟️</span>
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-black text-gray-900 mb-2">Page Not Found</h1>
      <p className="text-gray-400 text-sm max-w-xs mb-8 leading-relaxed">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <div className="flex gap-3">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-50 transition">
          <FiArrowLeft size={14} /> Go Back
        </button>
        <Link to="/"
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition active:scale-95">
          <FiHome size={14} /> Home
        </Link>
      </div>
    </motion.div>
  );
}
