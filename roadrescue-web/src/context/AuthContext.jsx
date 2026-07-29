import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, loginWithGoogleWeb } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user session from localStorage on load
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('jwt_token');
      const savedUser = localStorage.getItem('user');
      if (savedToken && savedUser && savedUser !== 'undefined') {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error('Session load error:', e);
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }

    // Setup global listener for auth session expiry (axios 401)
    const handleExpiry = () => {
      logoutUser();
    };
    window.addEventListener('auth_session_expired', handleExpiry);
    return () => window.removeEventListener('auth_session_expired', handleExpiry);
  }, []);

  const loginUser = async (email, password) => {
    setLoading(true);
    try {
      localStorage.removeItem('activeRole');
      localStorage.removeItem('dashboardType');
      localStorage.removeItem('lastPortal');
      const response = await apiLogin(email, password);
      // Backend returns AuthResponse: { token, id, name, email, role, phone, avatarUrl }
      const authData = response.data;
      
      localStorage.setItem('jwt_token', authData.token);
      
      const userProfile = {
        id: authData.id,
        name: authData.name,
        email: authData.email,
        role: authData.role,
        phone: authData.phone,
        avatarUrl: authData.avatarUrl
      };
      localStorage.setItem('user', JSON.stringify(userProfile));
      
      setToken(authData.token);
      setUser(userProfile);
      return userProfile;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (userData) => {
    setLoading(true);
    try {
      localStorage.removeItem('activeRole');
      localStorage.removeItem('dashboardType');
      localStorage.removeItem('lastPortal');
      const response = await apiRegister(userData);
      // If registration returns JWT immediately
      if (response.data && response.data.token) {
        const authData = response.data;
        localStorage.setItem('jwt_token', authData.token);
        
        const userProfile = {
          id: authData.id,
          name: authData.name,
          email: authData.email,
          role: authData.role,
          phone: authData.phone,
          avatarUrl: authData.avatarUrl
        };
        localStorage.setItem('user', JSON.stringify(userProfile));
        
        setToken(authData.token);
        setUser(userProfile);
        return userProfile;
      }
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginUserWithGoogle = async (role) => {
    setLoading(true);
    try {
      localStorage.removeItem('activeRole');
      localStorage.removeItem('dashboardType');
      localStorage.removeItem('lastPortal');
      const response = await loginWithGoogleWeb(role);
      const authData = response.data;
      
      localStorage.setItem('jwt_token', authData.token);
      
      const userProfile = {
        id: authData.id,
        name: authData.name,
        email: authData.email,
        role: authData.role,
        phone: authData.phone,
        avatarUrl: authData.avatarUrl
      };
      localStorage.setItem('user', JSON.stringify(userProfile));
      
      setToken(authData.token);
      setUser(userProfile);
      return userProfile;
    } catch (error) {
      console.error('Google Auth error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeRole');
    localStorage.removeItem('dashboardType');
    localStorage.removeItem('lastPortal');
    localStorage.removeItem('adminSessionToken');
    localStorage.removeItem('adminSessionExpiry');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('rr_mechanic_approved');
    localStorage.removeItem('rr_mechanic_profile');
    setToken(null);
    setUser(null);
  };

  const updatePhoneInSession = (newPhone, newAvatar, newName) => {
    if (user) {
      const updatedUser = { 
        ...user, 
        phone: newPhone, 
        phoneNumber: newPhone,
        ...(newAvatar ? { avatarUrl: newAvatar, avatar: newAvatar } : {}),
        ...(newName ? { name: newName } : {})
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  const updateRoleInSession = (newRole) => {
    if (user) {
      const updatedUser = { 
        ...user, 
        role: newRole.toUpperCase()
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginUser, registerUser, loginUserWithGoogle, logoutUser, updatePhoneInSession, updateRoleInSession }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
