import api from '../lib/api';

export const tournamentService = {
  getAll: (params) => api.get('/tournaments', { params }),
  getById: (id) => api.get(`/tournaments/${id}`),
  create: (data) => api.post('/tournaments', data),
  join: (id) => api.post(`/tournaments/${id}/join`),
  getFixtures: (id) => api.get(`/tournaments/${id}/fixtures`),
  getStandings: (id) => api.get(`/tournaments/${id}/standings`),
};
