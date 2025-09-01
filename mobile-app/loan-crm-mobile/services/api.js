import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://10.0.2.2:4000/api', // 10.0.2.2 points to localhost of host machine in Android emulator
});

// Add request interceptor to add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear token and redirect to login
      await AsyncStorage.removeItem('token');
      // Navigation will be handled by the auth context
      
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

// Auth services
const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
    }
    return response.data;
  },
  logout: async () => {
    await AsyncStorage.removeItem('token');
  },
  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem('token');
    return !!token;
  }
};

// Installments services
const installmentsService = {
  getDueInstallments: async () => {
    const response = await api.get('/installments/due');
    return response.data;
  },
  updatePayment: async (paymentData) => {
    const response = await api.post('/payments', paymentData);
    return response.data;
  },
  markAsBounced: async (installmentId, bounceData) => {
    const response = await api.put(`/installments/${installmentId}`, bounceData);
    return response.data;
  },
  uploadCSV: async (formData) => {
    const response = await api.post('/installments/upload-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

// Collections services
const collectionsService = {
  getMonthlyCollection: async () => {
    const response = await api.get('/collections/monthly');
    return response.data;
  },
  getDailyCollection: async () => {
    const response = await api.get('/collections/daily');
    return response.data;
  },
  getBranchPerformance: async () => {
    const response = await api.get('/collections/branch-performance');
    return response.data;
  },
  getOverdueAnalysis: async () => {
    const response = await api.get('/collections/overdue-analysis');
    return response.data;
  }
};

export { api, authService, installmentsService, collectionsService };