import api from './client';

export const reportApi = {
  create: (payload) => api.post('/reports', payload),
  getAll: () => api.get('/reports'),
  getMine: () => api.get('/student/reports'),
  reply: (reportId, message) => api.post(`/reports/${reportId}/replies`, { message }),
};
