import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark border-bottom border-secondary sticky-top px-3 py-2" style={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(15, 17, 23, 0.95)' }}>
      <div className="container-fluid">
        {/* Brand Logo */}
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <i className="fas fa-truck-monster text-gradient-primary me-2 fs-3"></i>
          <span className="fw-bold font-outfit fs-4 tracking-tight" style={{ letterSpacing: '-0.5px' }}>
            Road<span style={{ color: 'var(--primary-color)' }}>Rescue</span>
          </span>
        </Link>

        {/* Hamburger Toggle */}
        <button 
          className="navbar-toggler border-0" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#roadrescueNavbar" 
          aria-controls="roadrescueNavbar" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Collapsible Content */}
        <div className="collapse navbar-collapse" id="roadrescueNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-4 align-items-center">
            <li className="nav-item">
              <Link className="nav-link text-light px-3 py-2" to="/">Home</Link>
            </li>
            <li className="nav-item">
              <a 
                className="nav-link px-3 py-2 d-flex align-items-center gap-1.5" 
                href="/RoadRescue.apk" 
                download="RoadRescue.apk"
                style={{ color: '#FF6B35', fontWeight: '600' }}
                title="Download RoadRescue Android App"
              >
                <i className="fab fa-android text-warning fs-5"></i>
                <span className="ms-1">Download App</span>
                <span className="badge bg-warning text-dark ms-1 rounded-pill" style={{ fontSize: '10px', padding: '2px 6px' }}>v1.0</span>
              </a>
            </li>
            
            {/* Dynamic Dashboard Links depending on Role */}
            {user && (user.role === 'USER' || user.role === 'CUSTOMER') && (
              <li className="nav-item">
                <Link className="nav-link text-light px-3 py-2" to="/dashboard">
                  <i className="fas fa-desktop me-1 text-primary"></i> Driver Panel
                </Link>
              </li>
            )}
            
            {user && user.role === 'MECHANIC' && (
              <li className="nav-item">
                <Link className="nav-link text-light px-3 py-2" to="/mechanic">
                  <i className="fas fa-screwdriver-wrench me-1 text-warning"></i> Mechanic Panel
                </Link>
              </li>
            )}
            
            {user && user.role === 'ADMIN' && (
              <li className="nav-item">
                <Link className="nav-link text-light px-3 py-2" to="/admin">
                  <i className="fas fa-shield-halved me-1 text-info"></i> Admin Control
                </Link>
              </li>
            )}
          </ul>

          {/* User Profile / Auth Action Buttons */}
          <div className="d-flex align-items-center gap-3">
            {user ? (
              <div className="dropdown">
                <button 
                  className="btn btn-link nav-link dropdown-toggle d-flex align-items-center text-white border-0 py-1" 
                  type="button" 
                  id="userDropdown" 
                  data-bs-toggle="dropdown" 
                  aria-expanded="false"
                >
                  <img 
                    src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=FF6B35&color=fff`} 
                    alt={user.name} 
                    className="rounded-circle me-2 border border-warning"
                    width="35" 
                    height="35"
                  />
                  <span className="fw-medium d-none d-sm-inline">{user.name}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow border-secondary bg-dark text-white p-2 mt-2" aria-labelledby="userDropdown">
                  <li className="px-3 py-2 border-bottom border-secondary mb-1">
                    <div className="fw-bold">{user.name}</div>
                    <small className="text-muted d-block">{user.email}</small>
                    <span className="badge bg-warning text-dark mt-1 fs-xs fw-semibold">{user.role}</span>
                  </li>
                  {(user.role === 'USER' || user.role === 'CUSTOMER') && (
                    <li>
                      <Link className="dropdown-item text-white rounded py-2 px-3" to="/dashboard">
                        <i className="fas fa-list me-2"></i> Service History
                      </Link>
                    </li>
                  )}
                  {user.role === 'MECHANIC' && (
                    <li>
                      <Link className="dropdown-item text-white rounded py-2 px-3" to="/mechanic">
                        <i className="fas fa-gears me-2"></i> Job Dashboard
                      </Link>
                    </li>
                  )}
                  {user.role === 'ADMIN' && (
                    <li>
                      <Link className="dropdown-item text-white rounded py-2 px-3" to="/admin">
                        <i className="fas fa-chart-line me-2"></i> System Analytics
                      </Link>
                    </li>
                  )}
                  <li><hr className="dropdown-divider border-secondary" /></li>
                  <li>
                    <button className="dropdown-item text-danger rounded py-2 px-3" onClick={handleLogout}>
                      <i className="fas fa-sign-out-alt me-2"></i> Log Out
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary-custom px-4 py-2 text-decoration-none">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary-custom px-4 py-2 text-decoration-none">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
