import axios from 'axios';

const api = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  // TODO: attach JWT from secure storage
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      // TODO: redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;
