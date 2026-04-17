import api from '../lib/api';

export const teamService = {
  getMyTeams: () => api.get('/teams/my'),
  getById: (id) => api.get(`/teams/${id}`),
  search: (params) => api.get('/teams/search', { params }),
  create: (data) => api.post('/teams', data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),
  addPlayer: (id, data) => api.post(`/teams/${id}/players`, data),
  removePlayer: (id, userId) => api.delete(`/teams/${id}/players/${userId}`),
  searchPlayers: (params) => api.get('/teams/players/search', { params }),
  transferOwnership: (id, data) => api.post(`/teams/${id}/transfer`, data),
  acceptInvite: (id) => api.post(`/teams/${id}/accept-invite`),
  rejectInvite: (id) => api.post(`/teams/${id}/reject-invite`),
};
