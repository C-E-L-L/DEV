import api from './client';

export const adminApi = {
  getSmears: () => api.get('/admin/smears'),
  getCrops: () => api.get('/admin/crops'),
  getProfessors: () => api.get('/admin/professors'),
  createProfessor: (payload) => api.post('/admin/professors', payload),
  resetProfessorPassword: (userId, password) =>
    api.put(`/admin/professors/${userId}/password`, { password }),
  updateProfessorStatus: (userId, status) =>
    api.put(`/admin/professors/${userId}/status`, { status }),
  getStudentRoster: () => api.get('/admin/student-roster'),
  addStudentRoster: (studentIds) => api.post('/admin/student-roster', { studentIds }),
  getStudentSignups: (status = 'PENDING') => api.get('/admin/student-signups', { params: { status } }),
  getStudents: (status = 'ALL') => api.get('/admin/students', { params: { status } }),
  updateStudentStatus: (userId, status) =>
    api.put(`/admin/students/${userId}/status`, { status }),
  approveStudentSignup: (userId) => api.put(`/admin/student-signups/${userId}/approve`),
  rejectStudentSignup: (userId) => api.put(`/admin/student-signups/${userId}/reject`),
};
