import api from './client';

export const authApi = {
  register: (username, password, role, name) =>
    api.post('/auth/register', { username, password, role, name }),

  login: (username, password) =>
    api.post('/auth/login', { username, password }),
};
