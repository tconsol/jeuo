import api from '../lib/api';

export const venueService = {
  getAll: () => api.get('/venues/owner/my-venues'),
  getById: (id) => api.get(`/venues/${id}`),
  create: (data) => api.post('/venues', data),
  update: (id, data) => api.put(`/venues/${id}`, data),
  delete: (id) => api.delete(`/venues/${id}`),
  uploadImages: (id, formData) => api.post(`/venues/${id}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const bookingService = {
  getAll: (params) => api.get('/bookings/owner', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
};

export const revenueService = {
  getSummary: (params) => api.get('/bookings/owner/revenue', { params }),
};

export const dashboardService = {
  getStats: () => api.get('/venues/owner/stats'),
};
