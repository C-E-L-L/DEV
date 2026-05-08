import api from './client';

export const statsApi = {
  getByTaskId: (taskId) =>
    api.get(`/tasks/${taskId}/stats`),

  getAll: () =>
    api.get('/all-stats'),
};
