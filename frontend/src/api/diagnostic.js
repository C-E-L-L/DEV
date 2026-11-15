import api from './client';
import client from './client';

export const diagnosticApi = {
  getPoolStats: (speciesId) =>
    api.get('/tasks/diagnostic/pool-stats', { params: { speciesId } }),

  createTask: (payload) =>
    api.post('/tasks/diagnostic/create', payload),
  getStudentMatrices: () => client.get('/tasks/diagnostic/student-matrices')
};
