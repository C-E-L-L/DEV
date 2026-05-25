import api from './client';

export const labelingApi = {
  exportTask: (taskId) =>
    api.get(`/labeling/tasks/${taskId}/export`, { responseType: 'blob' }),

  importTask: (taskId, manifest) =>
    api.post(`/labeling/tasks/${taskId}/import`, manifest),
};
