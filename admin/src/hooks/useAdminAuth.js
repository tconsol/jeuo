import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export function useAdminAuth() {
  const navigate = useNavigate();

  const login = useCallback(async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('admin_token', data.data?.tokens?.accessToken || data.data.accessToken);
    localStorage.setItem('admin_refreshToken', data.data?.tokens?.refreshToken || data.data.refreshToken);
    return data.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refreshToken');
    navigate('/login');
  }, [navigate]);

  const isAuthenticated = useCallback(() => !!localStorage.getItem('admin_token'), []);

  return { login, logout, isAuthenticated };
}
