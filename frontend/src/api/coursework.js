import api from './client';

export const courseworkApi = {
  get: id => api.get(`/coursework/${id}`),
  save: (id, payload) => api.put(`/coursework/${id}`, payload),
  publish: (id, payload) => api.post(`/coursework/${id}/publish`, payload),
  copy: id => api.post(`/coursework/${id}/copy`),
  data: () => api.get('/coursework/data'),
};
