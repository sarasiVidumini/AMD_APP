import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Expo exposes env vars prefixed with EXPO_PUBLIC_ to client code (replaces Vite's import.meta.env).
// Set EXPO_PUBLIC_API_BASE_URL in a .env file at your project root.
//
// IMPORTANT for React Native (unlike web):
// - 'localhost' does NOT point to your dev machine from a physical phone or emulator.
// - Physical phone on Expo Go: use your machine's LAN IP, e.g. http://192.168.1.5:5000
// - Android emulator: use http://10.0.2.2:5000
// - iOS simulator: http://localhost:5000 does work
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const API = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// AsyncStorage is async, so the interceptor must be async too (unlike localStorage on web)
API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;