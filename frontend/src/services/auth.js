import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

axios.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Secure token storage using httpOnly cookies would be better
// For now, sanitizing data before localStorage
const sanitizeData = (data) => {
  if (typeof data === 'string') {
    return data.replace(/[<>"'&]/g, '');
  }
  return data;
};

export const authService = {
  login: async (username, password) => {
    const response = await axios.post('http://localhost:4000/auth/login', { 
      username: sanitizeData(username), 
      password: sanitizeData(password) 
    });
    if (response.data.token) {
      sessionStorage.setItem('token', response.data.token);
      sessionStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  },

  isAuthenticated: () => !!sessionStorage.getItem('token')
};