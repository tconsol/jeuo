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
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Venues from './pages/Venues';
import VenueDetail from './pages/VenueDetail';
import VenueBooking from './pages/venue/VenueBooking';
import Activities from './pages/Activities';
import ActivityDetail from './pages/ActivityDetail';
import CreateActivity from './pages/activity/CreateActivity';
import LiveScoring from './pages/LiveScoring';
import LiveMatches from './pages/LiveMatches';
import MatchDetail from './pages/MatchDetail';
import MatchHistory from './pages/match/MatchHistory';
import Tournaments from './pages/Tournaments';
import TournamentDetail from './pages/tournament/TournamentDetail';
import Profile from './pages/Profile';
import EditProfile from './pages/profile/EditProfile';
import UserDashboard from './pages/dashboard/UserDashboard';
import Bookings from './pages/Bookings';
import Wallet from './pages/wallet/Wallet';
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
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Main app routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/venues" element={<Venues />} />
        <Route path="/venues/:id" element={<VenueDetail />} />
        <Route path="/venues/:id/book" element={
          <ProtectedRoute><VenueBooking /></ProtectedRoute>
        } />
        <Route path="/activities" element={<Activities />} />
        <Route path="/activities/:id" element={<ActivityDetail />} />
        <Route path="/activities/create" element={
          <ProtectedRoute><CreateActivity /></ProtectedRoute>
        } />
        <Route path="/matches/live" element={<LiveMatches />} />
        <Route path="/matches/history" element={
          <ProtectedRoute><MatchHistory /></ProtectedRoute>
        } />
        <Route path="/matches/:id" element={<MatchDetail />} />
        <Route path="/scoring/:matchId" element={
          <ProtectedRoute><LiveScoring /></ProtectedRoute>
        } />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/tournaments/:id" element={<TournamentDetail />} />
        <Route path="/profile/:id?" element={<Profile />} />
        <Route path="/profile/edit" element={
          <ProtectedRoute><EditProfile /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><UserDashboard /></ProtectedRoute>
        } />
        <Route path="/bookings" element={
          <ProtectedRoute><Bookings /></ProtectedRoute>
        } />
        <Route path="/wallet" element={
          <ProtectedRoute><Wallet /></ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute><Notifications /></ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
