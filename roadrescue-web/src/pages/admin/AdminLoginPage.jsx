import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import '../../styles/adminDashboard.css';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const { login, isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  const isMounted = useRef(true);

  // Redirect instantly if session is already valid
  useEffect(() => {
    isMounted.current = true;
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
    return () => {
      isMounted.current = false;
    };
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isMounted.current) return;
    setError('');

    if (!email || !password) {
      setError('Please provide email and password.');
      return;
    }

    setAuthLoading(true);
    try {
      await login(email.trim(), password);
      if (!isMounted.current) return;
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      console.error('[AdminLogin] Submission error:', err);
      if (!isMounted.current) return;

      const msg = err.message || '';
      if (
        msg.includes('Not authorized') || 
        msg.includes('profile') || 
        msg.includes('malformed') || 
        msg.includes('suspended') || 
        msg.includes('inactive')
      ) {
        setError(msg);
      } else {
        setError('Invalid administrative credentials.');
      }
    } finally {
      if (isMounted.current) {
        setAuthLoading(false);
      }
    }
  };

  return (
    <div className="admin-theme min-vh-100 d-flex align-items-center justify-content-center px-3" style={{ backgroundColor: '#0F1419' }}>
      <div className="w-100" style={{ maxWidth: '440px' }}>
        
        {/* Branding Console Header */}
        <div className="text-center mb-4">
          <i className="fas fa-shield-halved text-gradient-primary mb-2 fs-1" style={{ color: '#FF6B35' }}></i>
          <h2 className="fw-black font-outfit text-white mb-1 tracking-tight">RoadRescue</h2>
          <span className="text-uppercase text-muted fw-bold" style={{ fontSize: '12px', letterSpacing: '2px' }}>
            Enterprise Management Console
          </span>
        </div>

        {/* Card */}
        <div className="admin-glass-card p-4">
          <h4 className="fw-bold font-outfit text-white text-center mb-4">Admin Authentication</h4>
          
          {error && (
            <div 
              className="alert alert-danger d-flex align-items-center border-0 py-2.5 px-3 mb-4 rounded-3" 
              style={{ backgroundColor: 'rgba(244, 67, 54, 0.12)', color: '#FF8A80', fontSize: '13px' }}
            >
              <i className="fas fa-triangle-exclamation me-2"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label text-white-50 small fw-semibold mb-1">Administrative Email</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-0 text-white-50"><i className="fas fa-envelope"></i></span>
                <input 
                  type="email" 
                  className="form-control admin-input border-0" 
                  placeholder="admin@roadrescue.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={authLoading}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label text-white-50 small fw-semibold mb-1">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-0 text-white-50"><i className="fas fa-lock"></i></span>
                <input 
                  type="password" 
                  className="form-control admin-input border-0" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={authLoading}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn admin-btn-primary w-100 py-2.5 d-flex align-items-center justify-content-center gap-2"
              disabled={authLoading}
              aria-busy={authLoading ? "true" : "false"}
            >
              {authLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i>
                  <span>Sign in to Portal</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-4">
          <small className="text-muted" style={{ fontSize: '11px' }}>
            Authorized Personnel Only. Actions are logged and monitored.
          </small>
        </div>

      </div>
    </div>
  );
};

export default AdminLoginPage;
