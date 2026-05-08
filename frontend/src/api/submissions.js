import api from './client';

export const submissionApi = {
  submit: (cropId, studentId, studentLabel) =>
    api.post('/submit', { cropId, studentId, studentLabel }),

  getSolvedCrops: (taskId, studentId) =>
    api.get(`/tasks/${taskId}/submissions/${studentId}`),

  getMyResults: (taskId, studentId) =>
    api.get(`/tasks/${taskId}/my-results/${studentId}`),
};
