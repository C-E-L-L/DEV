import api from './client';

export const professorApi = {
  // Final submissions per published coursework and the student list they are counted against.
  progress: () => api.get('/professor/progress'),
  // Recent submissions, questions and closed deadlines (dashboard feed and notification bell).
  activity: (limit = 30) => api.get('/professor/activity', { params: { limit } }),
  // Every student against every published coursework (answers, confirmed-answer score, final submission).
  gradebook: () => api.get('/professor/gradebook'),
  calibration: params => api.get('/professor/calibration', { params }),
  importRoster: rows => api.post('/professor/students/roster/import', { rows }),
};
