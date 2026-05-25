import api from './client';
import client from './client';

export const diagnosticApi = {
  getPoolStats: () =>
    api.get('/tasks/diagnostic/pool-stats'),

  createTask: (payload) =>
    api.post('/tasks/diagnostic/create', payload),
  getStudentMatrices: () => client.get('/tasks/diagnostic/student-matrices')
};