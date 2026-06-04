import axios from 'axios';

export const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`;
const API_URL = `${BASE_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

axios.defaults.withCredentials = true;

// Request interceptor (Optional: can be used for logging or other headers)
api.interceptors.request.use((config) => {
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle errors globally
api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response?.status === 401) {
    // Handle unauthorized (logout user)
    localStorage.clear();
    window.location.href = '/';
  }
  return Promise.reject(error);
});

export default api;
