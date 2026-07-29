/**
 * Enterprise API Service
 * Centralized axios-based API handler for Spring Boot Backend
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Adjust for your local machine's development IP address (not localhost for physical devices)
const BASE_URL = 'http://192.168.1.100:8080/api'; 

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor for JWT
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for Error Handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Global 401 handler (Token Expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      await AsyncStorage.removeItem('jwt_token');
    }
    
    return Promise.reject(error);
  }
);

/**
 * AUTH APIs
 */
export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (userData) => api.post('/auth/register', userData);

/**
 * REQUEST APIs
 */
export const createServiceRequest = (data) => api.post('/requests/create', data);
export const getActiveRequest = (userId, role) => api.get(`/requests/active/${userId}`, { params: { role } });
export const updateRequestStatus = (id, status) => api.put(`/requests/status/${id}`, { status });
export const acceptRequest = (id, mechanicUserId) => api.post(`/requests/accept/${id}`, { mechanicUserId });
export const cancelRequest = (id) => api.post(`/requests/cancel/${id}`);
export const getRequestHistory = (userId, role) => api.get(`/requests/history/${userId}`, { params: { role } });
export const getNearbyRequests = (lat, lng, radius = 25) => 
  api.get('/requests/nearby', { params: { lat, lng, radius } });
export const getAllRequests = () => api.get('/requests');

/**
 * MECHANIC APIs
 */
export const getNearbyMechanics = (lat, lng, radius = 25) => 
  api.get('/mechanics/nearby', { params: { lat, lng, radius } });

export const updateAvailability = (mechanicId, isAvailable) => 
  api.put(`/mechanics/${mechanicId}/availability`, { isAvailable });

export const updateMechanicLocation = (mechanicId, latitude, longitude) =>
  api.patch(`/mechanics/${mechanicId}/location`, { latitude, longitude });

export const updateMechanicStatus = (mechanicId, isOnline, isAvailable) =>
  api.patch(`/mechanics/${mechanicId}/status`, null, { params: { isOnline, isAvailable } });

export default api;
