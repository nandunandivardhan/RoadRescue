import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer'); // Toggle between 'customer' and 'mechanic'
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { loginUser, loginUserWithGoogle, user, token } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (token && user) {
      redirectUser(user.role);
    }
  }, [token, user]);

  const redirectUser = (role) => {
    if (role === 'ADMIN') {
      navigate('/admin');
    } else if (role === 'MECHANIC') {
      navigate('/mechanic');
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedUser = await loginUser(email, password);
      redirectUser(loggedUser.role);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const loggedUser = await loginUserWithGoogle(role);
      redirectUser(loggedUser.role);
    } catch (err) {
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center py-5" style={{ background: 'linear-gradient(180deg, #000000 0%, #16181D 100%)' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5 col-xl-4 text-center">
            
            {/* Header Brand Logo */}
            <div className="mb-4 d-inline-flex flex-column align-items-center">
              <div className="position-relative mb-2">
                <div className="rounded-circle d-flex justify-content-center align-items-center" style={{ width: '80px', height: '80px', backgroundColor: 'rgba(255, 215, 0, 0.1)', borderWidth: '1px', borderColor: 'rgba(255, 215, 0, 0.3)' }}>
                  <i className="fa-solid fa-car fs-2" style={{ color: '#FFD700' }}></i>
                </div>
                <div className="position-absolute d-flex justify-content-center align-items-center rounded-circle" style={{ bottom: '-2px', right: '-2px', width: '26px', height: '26px', backgroundColor: '#FFD700', border: '2px solid #000' }}>
                  <i className="fa-solid fa-bolt text-dark" style={{ fontSize: '11px' }}></i>
                </div>
              </div>
              <h1 className="font-outfit fw-black text-white mb-0" style={{ letterSpacing: '1px', fontSize: '2.2rem' }}>RoadRescue</h1>
              <p className="text-muted small mt-1">Premium Roadside Assistance</p>
            </div>

            {/* APK Role selection structure */}
            <div className="mb-3 text-start">
              <label className="form-label text-muted small fw-bold text-uppercase tracking-wider">Choose Your Role</label>
              <div className="d-flex gap-3">
                <button 
                  type="button" 
                  className={`flex-fill p-3 rounded-4 border text-start transition-all ${role === 'customer' ? 'border-warning bg-warning bg-opacity-10 text-white' : 'border-secondary border-opacity-20 bg-dark bg-opacity-50 text-muted'}`}
                  onClick={() => setRole('customer')}
                  style={{ borderRadius: '16px' }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div className="icon-circle p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px', backgroundColor: 'rgba(255,215,0,0.1)', color: '#FFD700' }}>
                      <i className="fa-solid fa-user fs-5"></i>
                    </div>
                    <div>
                      <div className="fw-bold text-white" style={{ fontSize: '14px' }}>Customer</div>
                      <small className="text-muted d-block" style={{ fontSize: '10px' }}>I need assistance.</small>
                    </div>
                  </div>
                </button>

                <button 
                  type="button" 
                  className={`flex-fill p-3 rounded-4 border text-start transition-all ${role === 'mechanic' ? 'border-success bg-success bg-opacity-10 text-white' : 'border-secondary border-opacity-20 bg-dark bg-opacity-50 text-muted'}`}
                  onClick={() => setRole('mechanic')}
                  style={{ borderRadius: '16px' }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div className="icon-circle p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px', backgroundColor: 'rgba(76,175,80,0.1)', color: '#4CAF50' }}>
                      <i className="fa-solid fa-screwdriver-wrench fs-5"></i>
                    </div>
                    <div>
                      <div className="fw-bold text-white" style={{ fontSize: '14px' }}>Mechanic</div>
                      <small className="text-muted d-block" style={{ fontSize: '10px' }}>I provide services.</small>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Login Card */}
            <div className="glass-card p-4 text-start mt-4" style={{ backgroundColor: 'rgba(20, 20, 20, 0.7)', border: '1px solid #2a2a2a', borderRadius: '16px' }}>
              
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="font-outfit fw-black text-white mb-0" style={{ fontSize: '1.6rem' }}>Welcome Back</h2>
                <span className="badge px-3 py-2 rounded-pill font-outfit fw-bold text-uppercase fs-xxs" style={{
                  backgroundColor: role === 'mechanic' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 215, 0, 0.1)',
                  color: role === 'mechanic' ? '#4CAF50' : '#FFD700',
                  border: role === 'mechanic' ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid rgba(255, 215, 0, 0.3)',
                }}>
                  Login as {role}
                </span>
              </div>

              {error && (
                <div className="alert alert-danger d-flex align-items-center py-2.5 px-3 small border-0 bg-danger bg-opacity-15 text-danger rounded-3 mb-4">
                  <i className="fas fa-circle-exclamation me-2"></i> {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                
                {/* Email address input */}
                <div className="mb-3">
                  <label className="form-label text-muted small fw-semibold">Email Address</label>
                  <div className="input-group" style={{ backgroundColor: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' }}>
                    <span className="input-group-text bg-transparent border-0 text-muted ps-3">
                      <i className="fas fa-envelope"></i>
                    </span>
                    <input 
                      type="email" 
                      className="form-control bg-transparent border-0 text-white py-3 ps-1" 
                      placeholder="driver@roadrescue.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ outline: 'none', boxShadow: 'none' }}
                      required 
                    />
                  </div>
                </div>

                {/* Password input */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label text-muted small fw-semibold mb-0">Password</label>
                    <a href="#" className="small text-decoration-none fw-medium" onClick={() => alert('Password recovery is currently under maintenance. Please contact support.')} style={{ color: '#FFD700' }}>Forgot?</a>
                  </div>
                  <div className="input-group" style={{ backgroundColor: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' }}>
                    <span className="input-group-text bg-transparent border-0 text-muted ps-3">
                      <i className="fas fa-lock"></i>
                    </span>
                    <input 
                      type="password" 
                      className="form-control bg-transparent border-0 text-white py-3 ps-1" 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ outline: 'none', boxShadow: 'none' }}
                      required 
                    />
                  </div>
                </div>

                {/* Sign In Trigger */}
                <div className="d-grid mb-4">
                  <button 
                    type="submit" 
                    className="btn w-100 py-3 rounded-3 fw-bold font-outfit text-dark transition-all"
                    disabled={isSubmitting}
                    style={{
                      background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                      border: 'none',
                      fontSize: '16px',
                      boxShadow: '0 4px 15px rgba(255, 165, 0, 0.2)',
                      borderRadius: '12px'
                    }}
                  >
                    {isSubmitting ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </div>
              </form>

              <div className="text-center mb-4 text-muted small">— OR —</div>

              {/* APK social container style */}
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <button 
                    type="button" 
                    className="btn w-100 py-3 rounded-3 border text-white d-flex align-items-center justify-content-center gap-2"
                    style={{ backgroundColor: '#1a1a1a', borderColor: '#333', fontSize: '14px', borderRadius: '12px' }}
                    onClick={handleGoogleSignIn}
                    disabled={isSubmitting}
                  >
                    <i className="fab fa-google text-danger fs-5"></i> <strong>Google</strong>
                  </button>
                </div>
                <div className="col-6">
                  <button 
                    type="button" 
                    className="btn w-100 py-3 rounded-3 border text-white d-flex align-items-center justify-content-center gap-2"
                    style={{ backgroundColor: '#1a1a1a', borderColor: '#333', fontSize: '14px', borderRadius: '12px' }}
                    onClick={() => alert('Phone authentication is optimized for native APK screens. Please sign in via Google or Email on Web.')}
                    disabled={isSubmitting}
                  >
                    <i className="fas fa-phone text-success fs-5"></i> <strong>Phone</strong>
                  </button>
                </div>
              </div>

              <div className="text-center mt-4">
                <span className="text-muted small">Don't have an account? </span>
                <Link to="/register" className="small text-decoration-none fw-bold" style={{ color: '#FFD700' }}>Sign Up</Link>
              </div>
            </div>
            
            {/* Account Info Notice */}
            <div className="mt-4 p-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-20 rounded-3 text-start small" style={{ borderRadius: '12px' }}>
              <div className="fw-bold text-warning mb-1"><i className="fas fa-circle-info me-1"></i> Account Information:</div>
              <p className="text-muted mb-0" style={{ fontSize: '11px' }}>
                Please enter your registered driver or mechanic credentials to sign in. Enterprise administration portals are restricted to authorized personnel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
