import axios from 'axios';

// Create a stable singleton instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Interceptor to automatically attach the JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cf_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;