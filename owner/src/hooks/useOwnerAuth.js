import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export function useOwnerAuth() {
  const navigate = useNavigate();

  const login = useCallback(async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('token', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    return data.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  }, [navigate]);

  const isAuthenticated = useCallback(() => !!localStorage.getItem('token'), []);

  return { login, logout, isAuthenticated };
}
