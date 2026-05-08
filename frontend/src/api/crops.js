import api from './client';

export const cropApi = {
  getByTaskId: (taskId) =>
    api.get(`/tasks/${taskId}/crops`),

  confirm: (cropId, finalLabel) =>
    api.put(`/crops/${cropId}/confirm`, { finalLabel }),

  confirmLabel: (cropId, finalLabel) =>
    api.put(`/crops/${cropId}/confirm`, { finalLabel }),

  getTrainingData: () =>
    api.get('/training-data'),
};
