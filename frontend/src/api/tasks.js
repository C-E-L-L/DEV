import api from './client';

export const taskApi = {
  getAll: () =>
    api.get('/tasks'),

  upload: (formData) =>
    api.post('/tasks/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  createAssignment: (formData) =>
    api.post('/assignments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteAssignment: (assignmentId) =>
    api.delete(`/assignments/${assignmentId}`),

  delete: (taskId) =>
    api.delete(`/tasks/${taskId}`),
};
