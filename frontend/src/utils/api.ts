import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('session_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// API functions
export const packagesApi = {
  getAll: (filters?: any) => api.get('/packages', { params: filters }),
  getById: (id: string) => api.get(`/packages/${id}`),
};

export const bookingsApi = {
  create: (data: any) => api.post('/bookings', data),
  getAll: () => api.get('/bookings'),
  getById: (id: string) => api.get(`/bookings/${id}`),
};

export const paymentsApi = {
  create: (data: any) => api.post('/payments', data),
  complete: (id: string) => api.post(`/payments/${id}/complete`),
  getById: (id: string) => api.get(`/payments/${id}`),
};

export const wishlistApi = {
  add: (packageId: string) => api.post('/wishlist', null, { params: { package_id: packageId } }),
  remove: (packageId: string) => api.delete(`/wishlist/${packageId}`),
  getAll: () => api.get('/wishlist'),
};

export const seedData = () => api.post('/seed');
