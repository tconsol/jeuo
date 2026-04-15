import api from '../lib/api';

export const venueService = {
  getAll: (params) => api.get('/venues', { params }),
  getById: (id) => api.get(`/venues/${id}`),
  getNearby: (lat, lng, radius) => api.get('/venues/nearby', { params: { lat, lng, radius } }),
  search: (query) => api.get('/venues/search', { params: { q: query } }),
  getSlots: (venueId, courtId, date) => api.get(`/venues/${venueId}/courts/${courtId}/slots`, { params: { date } }),
  addReview: (venueId, data) => api.post(`/venues/${venueId}/reviews`, data),
  getReviews: (venueId, params) => api.get(`/venues/${venueId}/reviews`, { params }),
};
