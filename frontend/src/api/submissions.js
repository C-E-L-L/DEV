import api from './client';

export const submissionApi = {
  submit: (cropId, studentId, studentLabel) =>
    api.post('/submit', { cropId, studentId, studentLabel }),

  getSolvedCrops: (taskId, studentId) =>
    api.get(`/tasks/${taskId}/submissions/${studentId}`),

  getMyResults: (taskId, studentId) =>
    api.get(`/tasks/${taskId}/my-results/${studentId}`),

  getSolvedCropsForAssignment: (assignmentId, studentId) =>
    api.get(`/assignments/${assignmentId}/submissions/${studentId}`),

  getMyResultsForAssignment: (assignmentId, studentId) =>
    api.get(`/assignments/${assignmentId}/my-results/${studentId}`),
};
