import api from './client';

export const submissionApi = {
  finalize: taskId => api.post(`/student/tasks/${taskId}/finalize`),
  attempt: taskId => api.get(`/student/tasks/${taskId}/attempt`),
  submit: (cropId, studentId, studentLabel) =>
    api.post('/submit', { cropId, studentId, studentLabel }),

  getSolvedCrops: (taskId, studentId) =>
    api.get(`/tasks/${taskId}/submissions/${studentId}`),

  getMyResults: (taskId, studentId) =>
    api.get(`/tasks/${taskId}/my-results/${studentId}`),

  getSolvedCropsForAssignment: (assignmentId, studentId) =>
    api.get(`/assignments/${assignmentId}/submissions/${studentId}`),

  getSolvedCropLabels: (taskId, studentId) =>
    api.get(`/tasks/${taskId}/submissions/${studentId}/labels`),

  getSolvedCropLabelsForAssignment: (assignmentId, studentId) =>
    api.get(`/assignments/${assignmentId}/submissions/${studentId}/labels`),

  getMyResultsForAssignment: (assignmentId, studentId) =>
    api.get(`/assignments/${assignmentId}/my-results/${studentId}`),

  getMyReviews: () =>
    api.get('/student/reviews'),
};
