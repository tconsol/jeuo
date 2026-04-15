import api from '../lib/api';

export const matchService = {
  getAll: (params) => api.get('/matches', { params }),
  getById: (id) => api.get(`/matches/${id}`),
  create: (data) => api.post('/matches', data),
  getLive: () => api.get('/matches/live'),
  getByActivity: (activityId) => api.get(`/matches/activity/${activityId}`),
};
