import api from '../lib/api';

export const disputeService = {
  create: (matchId, data) => api.post(`/disputes/match/${matchId}`, data),
  getByMatch: (matchId) => api.get(`/disputes/match/${matchId}`),
  getMyDisputes: (params) => api.get('/disputes/my', { params }),
  getById: (id) => api.get(`/disputes/${id}`),
  addComment: (id, text) => api.post(`/disputes/${id}/comment`, { text }),
};
