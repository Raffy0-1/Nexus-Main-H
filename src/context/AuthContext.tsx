import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { User, UserRole } from '../types';
import toast from 'react-hot-toast';
import { AuthContext } from './useAuth';

// Local storage keys
const USER_STORAGE_KEY = 'business_nexus_user';

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Re-hydrate user from API on initial load if token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    // Try to fetch the fresh user from the backend
    api.get('/profiles/me')
      .then(res => {
        const profile = res.data;
        const userData = profile.user || profile;
        // avatarUrl can be at profile root (merged from User model) or on the user subobject
        const avatarUrl = profile.avatarUrl || userData.avatarUrl ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent((userData.firstName || '') + ' ' + (userData.lastName || ''))}&background=random`;
        const hydratedUser: User = {
          id: userData._id || userData.id,
          name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.name || 'User',
          email: userData.email,
          role: userData.role as UserRole,
          avatarUrl,
          isOnline: true,
          bio: profile.bio || userData.bio || '',
          createdAt: userData.createdAt || new Date().toISOString()
        };
        setUser(hydratedUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(hydratedUser));
      })
      .catch(() => {
        // Token is invalid or expired — clear everything
        localStorage.removeItem('token');
        localStorage.removeItem(USER_STORAGE_KEY);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string, _role: UserRole): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data.user || response.data; // Accommodate different backend formats

      const loggedUser: User = {
        id: data._id || data.id,
        name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.name,
        email: data.email,
        role: data.role as UserRole,
        avatarUrl: data.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.firstName + ' ' + data.lastName)}&background=random`,
        isOnline: true,
        bio: data.bio || '',
        createdAt: data.createdAt || new Date().toISOString()
      };

      // Store token securely
      localStorage.setItem('token', response.data.token || data.token);

      setUser(loggedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedUser));
      toast.success('Successfully logged in!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    try {
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ') || 'User';

      const response = await api.post('/auth/register', {
        firstName,
        lastName,
        email,
        password,
        role
      });

      const data = response.data.user || response.data;
      const newUser: User = {
        id: data._id || data.id,
        name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.name || name,
        email: data.email,
        role: data.role as UserRole,
        avatarUrl: data.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.firstName + ' ' + data.lastName)}&background=random`,
        isOnline: true,
        bio: data.bio || '',
        createdAt: data.createdAt || new Date().toISOString()
      };

      localStorage.setItem('token', response.data.token || data.token);

      setUser(newUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Password reset instructions sent to your email');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error setting instructions');
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      toast.success('Password reset successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error resetting password');
    }
  };

  const logout = (): void => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
  };

  const updateProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
      await api.put('/profiles/me', {
        bio: updates.bio,
        location: (updates as any).location
      });

      if (user?.id === userId) {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      }
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Profile update failed');
      throw error;
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    isAuthenticated: !!user,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

