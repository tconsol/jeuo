import api from '../lib/api';

export const tournamentService = {
  getAll: (params) => api.get('/tournaments', { params }),
  getById: (id) => api.get(`/tournaments/${id}`),
  create: (data) => api.post('/tournaments', data),
  join: (id) => api.post(`/tournaments/${id}/join`),
  getFixtures: (id) => api.get(`/tournaments/${id}/fixtures`),
  getStandings: (id) => api.get(`/tournaments/${id}/standings`),
  
  // Team request endpoints
  requestJoinTournament: (tournamentId, teamData) => 
    api.post(`/tournaments/${tournamentId}/team-request`, teamData),
  
  getTeamRequests: (tournamentId) => 
    api.get(`/tournaments/${tournamentId}/team-requests`),
  
  approveTeamRequest: (tournamentId, requestIndex) => 
    api.post(`/tournaments/${tournamentId}/team-requests/${requestIndex}/approve`),
  
  rejectTeamRequest: (tournamentId, requestIndex, reason) => 
    api.post(`/tournaments/${tournamentId}/team-requests/${requestIndex}/reject`, { reason }),
};
