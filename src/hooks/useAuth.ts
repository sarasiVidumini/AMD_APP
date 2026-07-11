import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/index';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsedUser: User = JSON.parse(storedUser);
          if (parsedUser.email?.trim().toLowerCase() === 'admin@glowcare.ai') {
            parsedUser.role = 'admin';
          }
          setUser(parsedUser);
        }
      } catch (e) {
        console.error('Error parsing user:', e);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Syncs local state with updated user object from API
  const updateUser = async (updatedData: Partial<User>) => {
    if (!user) return;
    const newUser = { ...user, ...updatedData };
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const login = async (userData: User, token: string) => {
    const adjustedUser = { ...userData };
    if (adjustedUser.email?.trim().toLowerCase() === 'admin@glowcare.ai') {
      adjustedUser.role = 'admin';
    }
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(adjustedUser));
    setUser(adjustedUser);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  return { user, login, logout, updateUser, loading };
};