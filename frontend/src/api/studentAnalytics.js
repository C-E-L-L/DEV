import api from './client';

export const studentAnalyticsApi = {
  getHistory: studentId => api.get(`/analytics/students/${encodeURIComponent(studentId)}/history`),
  getTaskDetail: (studentId, taskId) => api.get(`/analytics/students/${encodeURIComponent(studentId)}/tasks/${taskId}`),
};
