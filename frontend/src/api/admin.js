import api from './client';

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  changePassword: (userId, newPassword) => api.put(`/admin/users/${userId}/password`, { newPassword }),
  getSmears: () => api.get('/admin/smears'),
  getCrops: () => api.get('/admin/crops'),
  getUsers: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  deleteUser: (username) => api.delete(`/admin/users/${username}`),
  updateUserStatus: (userId, status) => api.put(`/admin/users/${userId}/status`, { status }),
  getStudentRoster: () => api.get('/admin/student-roster'),
  addStudentRoster: (studentIds) => api.post('/admin/student-roster', { studentIds }),
};
