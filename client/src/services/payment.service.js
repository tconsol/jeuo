import api from '../lib/api';

export const paymentService = {
  createOrder: (data) => api.post('/payments/order', data),
  verify: (data) => api.post('/payments/verify', data),
  getHistory: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
};
