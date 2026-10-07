import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getSession } from '../storage/authStorage';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const { token } = await getSession();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (payload) => api.post('/auth/login', payload),
  register: (payload) => api.post('/auth/register', payload),
  me: () => api.get('/auth/me'),
};

export const listingsApi = {
  getAll: (params = {}) => api.get('/listings', { params }),
  getById: (id) => api.get(`/listings/${id}`),
};
