import api from '../lib/api';

export const scoringService = {
  getState: (matchId) => api.get(`/scoring/${matchId}`),
  pushEvent: (matchId, event) => api.post(`/scoring/${matchId}/event`, event),
  undoLast: (matchId) => api.post(`/scoring/${matchId}/undo`),
  endMatch: (matchId) => api.post(`/scoring/${matchId}/end`),
  getTimeline: (matchId) => api.get(`/scoring/${matchId}/timeline`),
};
