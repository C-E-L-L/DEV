import api from './client';

export const taskApi = {
  getAll: () =>
    api.get('/tasks'),

  upload: (formData) =>
    api.post('/tasks/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (taskId) =>
    api.delete(`/tasks/${taskId}`),
};
