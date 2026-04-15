import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Venues from './pages/Venues';
import VenueForm from './pages/VenueForm';
import Bookings from './pages/Bookings';
import Revenue from './pages/Revenue';

function RequireAuth({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="venues" element={<Venues />} />
        <Route path="venues/new" element={<VenueForm />} />
        <Route path="venues/:id/edit" element={<VenueForm />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="revenue" element={<Revenue />} />
      </Route>
    </Routes>
  );
}
