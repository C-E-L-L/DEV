import api from './client';

export const adminApi = {
  getSmears: () => api.get('/admin/smears'),
  getCrops: () => api.get('/admin/crops'),
  getUsers: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  deleteUser: (username) => api.delete(`/admin/users/${username}`),
};
