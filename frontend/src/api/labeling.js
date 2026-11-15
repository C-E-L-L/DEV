import api from './client';

export const labelingApi = {
  exportTask: (taskId) =>
    api.get(`/labeling/tasks/${taskId}/export`, { responseType: 'blob' }),

  // Several smears in one ZIP (a folder per smear).
  exportTasks: (taskIds) =>
    api.post('/labeling/tasks/export', { taskIds }, { responseType: 'blob' }),

  importTask: (taskId, manifest) =>
    api.post(`/labeling/tasks/${taskId}/import`, manifest),
};
