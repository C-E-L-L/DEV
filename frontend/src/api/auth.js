import api from './client';

export const authApi = {
  register: (username, password, role) =>
    api.post('/auth/register', { username, password, role }),

  login: (username, password) =>
    api.post('/auth/login', { username, password }),
};
