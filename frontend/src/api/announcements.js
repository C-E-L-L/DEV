import api from './client';
export const announcementApi = {
  list: () => api.get('/announcements'),
  manage: () => api.get('/admin/announcements'),
  create: data => api.post('/admin/announcements', data),
  update: (id, data) => api.put(`/admin/announcements/${id}`, data),
  delete: id => api.delete(`/admin/announcements/${id}`),
};

export const professorAnnouncementApi = {
  manage: () => api.get('/professor/announcements'),
  create: data => api.post('/professor/announcements', data),
  update: (id, data) => api.put(`/professor/announcements/${id}`, data),
  delete: id => api.delete(`/professor/announcements/${id}`),
};
