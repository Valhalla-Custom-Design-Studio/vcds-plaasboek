import axios from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://plaasboek-api.railway.app/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.message || err.message || 'Network error';
    return Promise.reject(new Error(msg));
  }
);
