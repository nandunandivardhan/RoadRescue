import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer'); // Toggle between 'customer' and 'mechanic'
  
  // Mechanic specific properties
  const [specialty, setSpecialty] = useState('flat_tire');
  const [experienceYears, setExperienceYears] = useState(5);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { registerUser, token, user, loginUserWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Redirect if logged in
  useEffect(() => {
    if (token && user) {
      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'MECHANIC') navigate('/mechanic');
      else navigate('/dashboard');
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
    setSuccess('');

    if (!name || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name,
        email,
        password,
        phone,
        role: role.toUpperCase(), // "USER" (customer) or "MECHANIC"
        ...(role === 'mechanic' ? { specialty, experienceYears } : {})
      };

      await registerUser(payload);
      
      setSuccess('Account created successfully! Redirecting...');
      setTimeout(() => {
        if (role === 'mechanic') navigate('/mechanic');
        else navigate('/dashboard');
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred during registration. Email may already exist.');
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
          <div className="col-md-7 col-lg-6 text-center">
            
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

            {/* Role cards selection */}
            <div className="mb-3 text-start">
              <label className="form-label text-muted small fw-bold text-uppercase tracking-wider">Choose Your Registration Role</label>
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

            {/* Register Card */}
            <div className="glass-card p-4 text-start mt-4" style={{ backgroundColor: 'rgba(20, 20, 20, 0.7)', border: '1px solid #2a2a2a', borderRadius: '16px' }}>
              
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="font-outfit fw-black text-white mb-0" style={{ fontSize: '1.6rem' }}>Create Account</h2>
                <span className="badge px-3 py-2 rounded-pill font-outfit fw-bold text-uppercase fs-xxs" style={{
                  backgroundColor: role === 'mechanic' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 215, 0, 0.1)',
                  color: role === 'mechanic' ? '#4CAF50' : '#FFD700',
                  border: role === 'mechanic' ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid rgba(255, 215, 0, 0.3)',
                }}>
                  Join as {role}
                </span>
              </div>

              {error && (
                <div className="alert alert-danger d-flex align-items-center py-2.5 px-3 small border-0 bg-danger bg-opacity-15 text-danger rounded-3 mb-4">
                  <i className="fas fa-circle-exclamation me-2"></i> {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success d-flex align-items-center py-2.5 px-3 small border-0 bg-success bg-opacity-15 text-success rounded-3 mb-4">
                  <i className="fas fa-circle-check me-2"></i> {success}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row">
                  {/* Name */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small fw-semibold">Full Name *</label>
                    <div className="input-group" style={{ backgroundColor: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' }}>
                      <span className="input-group-text bg-transparent border-0 text-muted ps-3">
                        <i className="fas fa-user"></i>
                      </span>
                      <input 
                        type="text" 
                        className="form-control bg-transparent border-0 text-white py-3 ps-1" 
                        placeholder="Ananya Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ outline: 'none', boxShadow: 'none' }}
                        required 
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small fw-semibold">Email Address *</label>
                    <div className="input-group" style={{ backgroundColor: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' }}>
                      <span className="input-group-text bg-transparent border-0 text-muted ps-3">
                        <i className="fas fa-envelope"></i>
                      </span>
                      <input 
                        type="email" 
                        className="form-control bg-transparent border-0 text-white py-3 ps-1" 
                        placeholder="name@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ outline: 'none', boxShadow: 'none' }}
                        required 
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  {/* Phone */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small fw-semibold">Phone Number</label>
                    <div className="input-group" style={{ backgroundColor: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' }}>
                      <span className="input-group-text bg-transparent border-0 text-muted ps-3">
                        <i className="fas fa-phone"></i>
                      </span>
                      <input 
                        type="tel" 
                        className="form-control bg-transparent border-0 text-white py-3 ps-1" 
                        placeholder="+91 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        style={{ outline: 'none', boxShadow: 'none' }}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small fw-semibold">Password (6+ chars) *</label>
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
                </div>

                {/* Mechanic Specific Config Panel */}
                {role === 'mechanic' && (
                  <div className="p-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-20 rounded-3 mb-4 animate-fade-in" style={{ borderRadius: '12px' }}>
                    <h6 className="text-white fw-bold mb-3 font-outfit fs-sm"><i className="fas fa-tools text-warning me-2"></i> Mechanic Profile Configuration</h6>
                    
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label text-muted small fw-semibold">Primary Specialty</label>
                        <select 
                          className="form-select bg-dark border-secondary border-opacity-35 text-white"
                          value={specialty}
                          onChange={(e) => setSpecialty(e.target.value)}
                          style={{ borderRadius: '10px' }}
                        >
                          <option value="flat_tire">Tire Repair Specialty</option>
                          <option value="battery">Battery jump Specialist</option>
                          <option value="engine">Engine cooling & diagnostics</option>
                          <option value="fuel">Emergency fuel supply</option>
                          <option value="towing">Towing & towing mechanics</option>
                          <option value="other">General mechanical repairs</option>
                        </select>
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label text-muted small fw-semibold">Years of Experience</label>
                        <input 
                          type="number" 
                          className="form-control bg-dark border-secondary border-opacity-35 text-white" 
                          min="1"
                          max="40"
                          value={experienceYears}
                          onChange={(e) => setExperienceYears(parseInt(e.target.value))}
                          style={{ borderRadius: '10px' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit button */}
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
                      "Create Account"
                    )}
                  </button>
                </div>
              </form>

              <div className="text-center mb-4 text-muted small">— OR —</div>

              {/* Google Sign-in Prominently */}
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
                    onClick={() => alert('Phone authentication is optimized for native APK screens. Please sign in via Google on Web.')}
                    disabled={isSubmitting}
                  >
                    <i className="fas fa-phone text-success fs-5"></i> <strong>Phone</strong>
                  </button>
                </div>
              </div>

              <div className="text-center mt-4">
                <span className="text-muted small">Already have an account? </span>
                <Link to="/login" className="small text-decoration-none fw-bold" style={{ color: '#FFD700' }}>Sign In</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
