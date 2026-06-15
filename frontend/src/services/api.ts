// =============================================================================
// File: frontend/src/services/api.ts
// Purpose: Centralized Axios instance with request and response interceptors
// =============================================================================

import axios from 'axios';

// Backend API Base URL
const API_URL = 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically attach JWT access token if it exists in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle unauthenticated responses (401)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check if the request failed due to authentication issues (401 Unauthorized)
    if (error.response && error.response.status === 401) {
      // Clear localStorage access token
      localStorage.removeItem('token');
      
      // Prevent infinite redirect loops if already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
