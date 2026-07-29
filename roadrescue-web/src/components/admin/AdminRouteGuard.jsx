import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { validateAdminSession, cleanupAllListeners } from '../../services/adminAuthService';
import { SESSION_TOKEN_KEY } from '../../services/adminSessionKeys';
import AdminErrorBoundary from './AdminErrorBoundary';

const AdminRouteGuard = () => {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const valid = await validateAdminSession();
      if (!isMounted) return;

      if (!valid) {
        cleanupAllListeners();
        setIsValid(false);
        setIsValidating(false);
        navigate('/admin-login', { replace: true });
        return;
      }

      setIsValid(true);
      setIsValidating(false);
    };

    checkSession();

    // 2. Start 60-second expiry poll
    const expiryInterval = setInterval(async () => {
      const valid = await validateAdminSession();
      if (!valid) {
        cleanupAllListeners();
        if (isMounted) {
          setIsValid(false);
        }
        navigate('/admin-login', { replace: true });
      }
    }, 60000);

    // 3. Start visibility-based re-validation
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        validateAdminSession().then((valid) => {
          if (!valid) {
            cleanupAllListeners();
            if (isMounted) {
              setIsValid(false);
            }
            navigate('/admin-login', { replace: true });
          }
        });
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // 4. Start storage event guard (multi-tab session invalidation)
    const onStorage = (e) => {
      if (e.key === SESSION_TOKEN_KEY && e.newValue === null) {
        cleanupAllListeners();
        if (isMounted) {
          setIsValid(false);
        }
        navigate('/admin-login', { replace: true });
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      isMounted = false;
      clearInterval(expiryInterval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('storage', onStorage);
    };
  }, [navigate]);

  if (isValidating) {
    return (
      <div 
        className="d-flex flex-column justify-content-center align-items-center min-vh-100 text-white" 
        style={{ backgroundColor: '#0F1419' }}
      >
        <div className="spinner-border text-warning mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
          <span className="visually-hidden">Loading console...</span>
        </div>
        <span className="text-uppercase fw-bold tracking-wider text-white-50" style={{ fontSize: '11px', letterSpacing: '2px' }}>
          Loading Management Console
        </span>
      </div>
    );
  }

  return isValid ? (
    <AdminErrorBoundary>
      <Outlet />
    </AdminErrorBoundary>
  ) : null;
};

export default AdminRouteGuard;
