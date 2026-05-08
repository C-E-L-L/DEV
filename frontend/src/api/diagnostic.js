import api from './client';
import client from './client';

export const diagnosticApi = {
  getPoolStats: () =>
    api.get('/tasks/diagnostic/pool-stats'),

  createTask: (payload) =>
    api.post('/tasks/diagnostic/create', payload),
  getStudentMatrices: (taskId) => client.get(`/tasks/${taskId}/diagnostic/student-matrices`)
};



export const getDiagnosticStudentMatrices = async (taskId) => {
    // client.js에 설정된 axios 인스턴스를 통해 GET 요청 전송 (토큰 자동 포함)
    const response = await client.get(`/tasks/${taskId}/diagnostic/student-matrices`);
    return response.data;
};