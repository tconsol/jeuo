import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import api from '../lib/api';
import { setUser, clearUser } from '../store/slices/authSlice';

export function useAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  const login = useCallback(async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    dispatch(setUser(data.data.user));
    return data.data;
  }, [dispatch]);

  const loginWithOtp = useCallback(async (phone, otp) => {
    const { data } = await api.post('/auth/verify-otp', { phone, otp });
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    dispatch(setUser(data.data.user));
    return data.data;
  }, [dispatch]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      dispatch(clearUser());
      navigate('/login');
    }
  }, [dispatch, navigate]);

  const fetchProfile = useCallback(async () => {
    const { data } = await api.get('/users/me');
    dispatch(setUser(data.data));
    return data.data;
  }, [dispatch]);

  return { user, isAuthenticated, loading, login, loginWithOtp, logout, fetchProfile };
}
