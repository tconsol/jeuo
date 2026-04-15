import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import BottomNav from '../components/layout/BottomNav';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pb-20 lg:pb-0">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
