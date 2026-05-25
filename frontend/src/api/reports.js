import api from './client';

export const reportApi = {
  create: (payload) => api.post('/reports', payload),
  getAll: () => api.get('/reports'),
};
