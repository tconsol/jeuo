import api from '../lib/api';

export const scoringService = {
  getState: (matchId) => api.get(`/scoring/${matchId}`),
  pushEvent: (matchId, event) => api.post(`/scoring/${matchId}/events`, event),
  undoLast: (matchId) => api.post(`/scoring/${matchId}/undo`),
  endMatch: (matchId) => api.post(`/scoring/${matchId}/end`),
  startMatch: (matchId) => api.post(`/scoring/${matchId}/start`),
  getTimeline: (matchId) => api.get(`/scoring/${matchId}/timeline`),
  getCommentary: (matchId) => api.get(`/scoring/${matchId}/commentary`),
  recordToss: (matchId, data) => api.post(`/scoring/${matchId}/toss`, data),
  setTossDecision: (matchId, data) => api.post(`/scoring/${matchId}/toss-decision`, data),
  setPlayers: (matchId, data) => api.post(`/scoring/${matchId}/players`, data),
  addScorer: (matchId, data) => api.post(`/scoring/${matchId}/scorer`, data),
  substitutePlayer: (matchId, data) => api.post(`/scoring/${matchId}/substitute`, data),
  confirmResult: (matchId) => api.post(`/scoring/${matchId}/confirm-result`),
  rematch: (matchId) => api.post(`/scoring/${matchId}/rematch`),
};
