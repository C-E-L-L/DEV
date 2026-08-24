import api from './client';

export const speciesApi = {
  getAll: () => api.get('/species'),
  create: (name) => api.post('/species', { name }),
  rename: (speciesId, name) => api.put(`/species/${speciesId}`, { name }),
  updateTask: (taskId, speciesId) => api.put(`/tasks/${taskId}/species`, { speciesId }),
};
