import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const NAV = [
  { to: '/', label: 'Dashboard', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  )},
  { to: '/users', label: 'Users', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )},
  { to: '/venues', label: 'Venue Approvals', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )},
  { to: '/analytics', label: 'Analytics', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )},
  { to: '/audit-logs', label: 'Audit Logs', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )},
  { to: '/disputes', label: 'Disputes', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )},
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refreshToken');
    navigate('/login');
  };

  const sidebarContent = (
    <>
      <div className="p-5 border-b border-blue-500/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 tracking-tight">Athleon</h1>
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/'} onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/5'
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
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-gray-200/80">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full bg-white shadow-xl flex flex-col">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-gray-200/60 flex items-center px-6 gap-4 sticky top-0 z-10">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="text-sm font-medium text-gray-400 hidden lg:block">Administration</h2>
          <div className="flex-1" />
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow">
            A
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
