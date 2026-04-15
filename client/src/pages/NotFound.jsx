import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="text-center py-20 px-4">
      <p className="text-8xl font-bold bg-gradient-to-br from-primary-200 to-primary-400 bg-clip-text text-transparent mb-4">404</p>
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">Page Not Found</h1>
      <p className="text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn-primary">Go Home</Link>
    </motion.div>
  );
}
