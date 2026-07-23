import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
});

// Anexa o JWT em toda requisição
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dentalcare_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Sessão expirada/token inválido -> volta pro login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('dentalcare_token');
      localStorage.removeItem('dentalcare_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
