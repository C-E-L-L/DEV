import api from './client';

export const adminApi = {
  getSmears: () => api.get('/admin/smears'),
  getCrops: () => api.get('/admin/crops'),
};
