import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * API Configuration
 * 
 * Ensure EXPO_PUBLIC_API_BASE_URL is set in your .env file at the project root.
 * - Development (Emulator): http://10.0.2.2:5000
 * - Production (Railway): https://your-backend-name.up.railway.app
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!BASE_URL) {
  console.warn('EXPO_PUBLIC_API_BASE_URL is not defined in your .env file.');
}

const API = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Increased timeout for production network latency
});

/**
 * Request Interceptor
 * Automatically attaches the JWT token to every request header
 */
API.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error retrieving token from storage:', error);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

/**
 * Response Interceptor (Optional)
 * Useful for handling global errors like 401 Unauthorized
 */
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the server returns 401, you could trigger a logout here
    if (error.response?.status === 401) {
      console.warn('Unauthorized - clearing token');
      AsyncStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default API;