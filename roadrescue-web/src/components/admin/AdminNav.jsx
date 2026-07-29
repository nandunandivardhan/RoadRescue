import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAdminAuth';

const AdminNav = () => {
  const { adminUser, logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
  };

  if (!adminUser) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark sticky-top admin-navbar px-3 py-2">
      <div className="container-fluid">
        {/* Brand */}
        <Link className="navbar-brand d-flex align-items-center" to="/admin/dashboard">
          <i className="fas fa-shield-halved text-gradient-primary me-2 fs-4" style={{ color: 'var(--admin-primary)' }}></i>
          <span className="fw-bold font-outfit fs-5 tracking-tight" style={{ letterSpacing: '-0.5px', color: '#E8E8E8' }}>
            RoadRescue <span style={{ color: 'var(--admin-primary)', fontSize: '12px', fontWeight: '800', border: '1px solid var(--admin-primary)', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px' }}>ADMIN</span>
          </span>
        </Link>

        {/* Toggle */}
        <button 
          className="navbar-toggler border-0" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#adminNavbarContent" 
          aria-controls="adminNavbarContent" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Collapsible Content */}
        <div className="collapse navbar-collapse" id="adminNavbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-4 align-items-center gap-2">
            <li className="nav-item">
              <Link 
                className={`admin-nav-item ${isActive('/admin/dashboard') ? 'active' : ''}`} 
                to="/admin/dashboard"
              >
                <i className="fas fa-chart-pie me-1.5"></i> Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`admin-nav-item ${isActive('/admin/mechanics') ? 'active' : ''}`} 
                to="/admin/mechanics"
              >
                <i className="fas fa-screwdriver-wrench me-1.5"></i> Mechanics
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`admin-nav-item ${isActive('/admin/customers') ? 'active' : ''}`} 
                to="/admin/customers"
              >
                <i className="fas fa-user-group me-1.5"></i> Customers
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`admin-nav-item ${isActive('/admin/sos-center') ? 'active' : ''}`} 
                to="/admin/sos-center"
              >
                <i className="fas fa-triangle-exclamation me-1.5"></i> SOS Center
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`admin-nav-item ${isActive('/admin/live-map') ? 'active' : ''}`} 
                to="/admin/live-map"
              >
                <i className="fas fa-map-location-dot me-1.5"></i> Live Map
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`admin-nav-item ${isActive('/admin/chat-monitoring') ? 'active' : ''}`} 
                to="/admin/chat-monitoring"
              >
                <i className="fas fa-comments-dollar me-1.5"></i> Chat Monitor
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`admin-nav-item ${isActive('/admin/apk-management') ? 'active' : ''}`} 
                to="/admin/apk-management"
              >
                <i className="fab fa-android me-1.5"></i> APK Manager
              </Link>
            </li>
          </ul>

          {/* Admin Metadata & Logout */}
          <div className="d-flex align-items-center gap-3">
            <div className="text-end d-none d-sm-block">
              <div className="fw-semibold text-white small" style={{ fontSize: '13px' }}>{adminUser.fullName}</div>
              <div className="text-muted text-uppercase" style={{ fontSize: '9px', letterSpacing: '0.5px' }}>{adminUser.role.replace('_', ' ')}</div>
            </div>
            
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(adminUser.fullName)}&background=FF6B35&color=fff`} 
              alt={adminUser.fullName} 
              className="rounded-circle border border-warning"
              width="36" 
              height="36"
            />

            <button 
              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5"
              onClick={handleLogout}
              style={{ fontSize: '12px', borderRadius: '6px' }}
            >
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNav;
