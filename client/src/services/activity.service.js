import api from '../lib/api';

export const activityService = {
  getAll: (params) => api.get('/activities', { params }),
  getById: (id) => api.get(`/activities/${id}`),
  create: (data) => api.post('/activities', data),
  join: (id) => api.post(`/activities/${id}/join`),
  leave: (id) => api.post(`/activities/${id}/leave`),
  getNearby: (lat, lng, radius) => api.get('/activities/nearby', { params: { lat, lng, radius } }),
  getMyActivities: (params) => api.get('/activities/me', { params }),
};
