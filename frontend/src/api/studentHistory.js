import api from './client';

export const studentHistoryApi = {
  getHistory: () => api.get('/student/history'),
  getAnswers: (taskId) => api.get(`/student/history/tasks/${taskId}`),
};
