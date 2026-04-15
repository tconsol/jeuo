import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { checkAuth } from './store/slices/authSlice';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Venues from './pages/Venues';
import VenueDetail from './pages/VenueDetail';
import Activities from './pages/Activities';
import ActivityDetail from './pages/ActivityDetail';
import LiveScoring from './pages/LiveScoring';
import LiveMatches from './pages/LiveMatches';
import MatchDetail from './pages/MatchDetail';
import Tournaments from './pages/Tournaments';
import Profile from './pages/Profile';
import Bookings from './pages/Bookings';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';

// Guards
import ProtectedRoute from './components/auth/ProtectedRoute';

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Main app routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/venues" element={<Venues />} />
        <Route path="/venues/:id" element={<VenueDetail />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/activities/:id" element={<ActivityDetail />} />
        <Route path="/matches/live" element={<LiveMatches />} />
        <Route path="/matches/:id" element={<MatchDetail />} />
        <Route path="/scoring/:matchId" element={
          <ProtectedRoute><LiveScoring /></ProtectedRoute>
        } />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/profile/:id?" element={<Profile />} />
        <Route path="/bookings" element={
          <ProtectedRoute><Bookings /></ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute><Notifications /></ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
