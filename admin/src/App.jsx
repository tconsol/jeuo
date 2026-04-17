import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import VenueApprovals from './pages/VenueApprovals';
import AuditLogs from './pages/AuditLogs';
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard';
import { DisputeManagement } from './pages/disputes';

function RequireAdmin({ children }) {
  const token = localStorage.getItem('admin_token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="venues" element={<VenueApprovals />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
        <Route path="disputes" element={<DisputeManagement />} />
      </Route>
    </Routes>
  );
}
