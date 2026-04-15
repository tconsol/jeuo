import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { FiSearch, FiBell, FiUser, FiLogOut, FiCalendar, FiGrid, FiCreditCard, FiClock } from 'react-icons/fi';
import { useState } from 'react';

export default function Navbar() {
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/venues', label: 'Venues' },
    { to: '/activities', label: 'Play' },
    { to: '/tournaments', label: 'Tournaments' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <span className="text-xl font-display font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              Athléon
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.to
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            <button className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200">
              <FiSearch size={19} />
            </button>

            {isAuthenticated ? (
              <>
                <Link to="/notifications" className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 relative">
                  <FiBell size={19} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100 transition-all duration-200 ml-1"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-sm font-semibold text-white shadow-sm">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </button>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-elevated border border-gray-100 py-2 animate-fade-in z-50">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900">{user?.name || 'User'}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{user?.phone || user?.email}</p>
                        </div>
                        <div className="py-1">
                          <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <FiUser size={16} className="text-gray-400" /> Profile
                          </Link>
                          <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <FiGrid size={16} className="text-gray-400" /> Dashboard
                          </Link>
                          <Link to="/bookings" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <FiCalendar size={16} className="text-gray-400" /> My Bookings
                          </Link>
                          <Link to="/wallet" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <FiCreditCard size={16} className="text-gray-400" /> Wallet
                          </Link>
                          <Link to="/matches/history" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <FiClock size={16} className="text-gray-400" /> Match History
                          </Link>
                        </div>
                        <div className="border-t border-gray-100 pt-1">
                          <button
                            onClick={() => { dispatch(logout()); setMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <FiLogOut size={16} /> Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <Link to="/login" className="btn-primary text-sm !px-5 !py-2">Sign In</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
