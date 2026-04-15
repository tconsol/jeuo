import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/users', label: 'Users', icon: '👥' },
  { to: '/venues', label: 'Venue Approvals', icon: '🏟️' },
  { to: '/analytics', label: 'Analytics', icon: '📈' },
  { to: '/audit-logs', label: 'Audit Logs', icon: '📝' },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refreshToken');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">Athleon <span className="text-primary-600">Admin</span></h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span>{icon}</span> {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button onClick={logout} className="sidebar-link w-full text-red-500 hover:text-red-600 hover:bg-red-50">
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
