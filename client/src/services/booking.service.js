import api from '../lib/api';

export const bookingService = {
  create: (data) => api.post('/bookings', data),
  getAll: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.post(`/bookings/${id}/cancel`),
  getMyBookings: (params) => api.get('/bookings/my', { params }),
};
