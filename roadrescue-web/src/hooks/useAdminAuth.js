import { useState, useEffect } from 'react';
import { 
  validateAdminSession, 
  loginAsAdmin as serviceLoginAsAdmin, 
  logoutAdmin as serviceLogoutAdmin 
} from '../services/adminAuthService';
import { 
  SESSION_TOKEN_KEY, 
  SESSION_EMAIL_KEY, 
  SESSION_ROLE_KEY 
} from '../services/adminSessionKeys';

export const useAdminAuth = () => {
  const [adminUser, setAdminUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const valid = await validateAdminSession();
        if (!isMounted) return;

        if (!valid) {
          setIsAuthenticated(false);
          setAdminUser(null);
          setLoading(false);
          return;
        }

        setAdminUser({
          uid: localStorage.getItem(SESSION_TOKEN_KEY),
          email: localStorage.getItem(SESSION_EMAIL_KEY),
          role: localStorage.getItem(SESSION_ROLE_KEY),
        });
        setIsAuthenticated(true);
      } catch (err) {
        console.error('[useAdminAuth] Mount validation failed:', err);
        if (isMounted) {
          setIsAuthenticated(false);
          setAdminUser(null);
          setError(err.message || 'Validation failed');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await serviceLoginAsAdmin(email, password);
      setAdminUser({
        uid: localStorage.getItem(SESSION_TOKEN_KEY),
        email: localStorage.getItem(SESSION_EMAIL_KEY),
        role: localStorage.getItem(SESSION_ROLE_KEY),
      });
      setIsAuthenticated(true);
      return data;
    } catch (err) {
      setIsAuthenticated(false);
      setAdminUser(null);
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await serviceLogoutAdmin();
    } catch (err) {
      console.error('[useAdminAuth] Logout failed:', err);
    } finally {
      setAdminUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  return {
    adminUser,
    isAuthenticated,
    loading,
    error,
    login,
    logout
  };
};

export default useAdminAuth;
