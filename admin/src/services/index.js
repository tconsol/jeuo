import api from '../lib/api';

export const userService = {
  getAll: (params) => api.get('/admin/users', { params }),
  getById: (id) => api.get(`/admin/users/${id}`),
  ban: (id) => api.patch(`/admin/users/${id}/ban`),
  unban: (id) => api.patch(`/admin/users/${id}/unban`),
  updateRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
};

export const venueService = {
  getPending: () => api.get('/admin/venues/pending'),
  approve: (id) => api.patch(`/admin/venues/${id}/approve`),
  reject: (id, reason) => api.patch(`/admin/venues/${id}/reject`, { reason }),
  getAll: (params) => api.get('/admin/venues', { params }),
};

export const analyticsService = {
  getOverview: () => api.get('/admin/analytics/overview'),
  getUserGrowth: (range) => api.get('/admin/analytics/user-growth', { params: { range } }),
  getRevenueChart: (range) => api.get('/admin/analytics/revenue', { params: { range } }),
  getSportDistribution: () => api.get('/admin/analytics/sports'),
};

export const auditService = {
  getLogs: (params) => api.get('/admin/audit-logs', { params }),
};

export const disputeService = {
  getAll: (params) => api.get('/admin/disputes', { params }),
  getById: (id) => api.get(`/admin/disputes/${id}`),
  resolve: (id, data) => api.patch(`/admin/disputes/${id}/resolve`, data),
};

export const dashboardService = {
  getStats: () => api.get('/admin/dashboard'),
};
