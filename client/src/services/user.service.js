import api from '../lib/api';

export const userService = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.patch('/users/me', data),
  uploadAvatar: (formData) => api.post('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getPublicProfile: (id) => api.get(`/users/${id}`),
  getStats: () => api.get('/users/me/stats'),
  addSport: (sport) => api.post('/users/me/sports', sport),
  removeSport: (sportId) => api.delete(`/users/me/sports/${sportId}`),
  getFollowers: (id, params) => api.get(`/users/${id}/followers`, { params }),
  getFollowing: (id, params) => api.get(`/users/${id}/following`, { params }),
  follow: (id) => api.post(`/users/${id}/follow`),
  unfollow: (id) => api.delete(`/users/${id}/follow`),
};
