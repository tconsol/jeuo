import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiMapPin, FiUsers, FiPlay, FiAward } from 'react-icons/fi';

const tabs = [
  { to: '/', icon: FiHome, label: 'Home' },
  { to: '/venues', icon: FiMapPin, label: 'Venues' },
  { to: '/activities', icon: FiUsers, label: 'Play' },
  { to: '/matches/my', icon: FiPlay, label: 'Matches' },
  { to: '/tournaments', icon: FiAward, label: 'Compete' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-200/60 safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {tabs.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                active
                  ? 'text-primary-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className={`p-1 rounded-lg transition-all duration-200 ${active ? 'bg-primary-50' : ''}`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
