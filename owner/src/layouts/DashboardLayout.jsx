import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const NAV = [
  { to: '/', label: 'Dashboard', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
    </svg>
  )},
  { to: '/venues', label: 'Venues', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )},
  { to: '/bookings', label: 'Bookings', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )},
  { to: '/revenue', label: 'Revenue', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )},
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  const sidebarContent = (
    <>
      <div className="p-5 border-b border-emerald-500/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 tracking-tight">Athleon</h1>
            <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest">Owner Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/'} onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-500/5'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`
            }>
            <span className="flex-shrink-0">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <button onClick={logout}
          className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-gray-200/80">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full bg-white shadow-xl flex flex-col">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-gray-200/60 flex items-center px-6 gap-4 sticky top-0 z-10">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="text-sm font-medium text-gray-400 hidden lg:block">Welcome back</h2>
          <div className="flex-1" />
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-xs font-bold text-white shadow">
            O
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
