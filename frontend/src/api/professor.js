import api from './client';

export const professorApi = {
  // Final submissions per published coursework and the student list they are counted against.
  progress: () => api.get('/professor/progress'),
  // Recent submissions, questions and closed deadlines (dashboard feed and notification bell).
  activity: (limit = 30) => api.get('/professor/activity', { params: { limit } }),
  calibration: params => api.get('/professor/calibration', { params }),
  importRoster: rows => api.post('/professor/students/roster/import', { rows }),
};
