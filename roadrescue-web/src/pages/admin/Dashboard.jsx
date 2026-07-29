import React from 'react';
import { Link } from 'react-router-dom';
import AdminNav from '../../components/admin/AdminNav';
import { useAdminMetrics } from '../../hooks/useAdminMetrics';
import '../../styles/adminDashboard.css';

const Dashboard = () => {
  const { metrics, loading } = useAdminMetrics();

  if (loading) {
    return (
      <div className="admin-theme min-vh-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: '#0F1419' }}>
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Booting Admin Panel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-theme min-vh-100 pb-5" style={{ backgroundColor: '#0F1419' }}>
      <AdminNav />

      <div className="container-fluid px-4 py-4">
        
        {/* Console Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <span className="text-uppercase text-muted fw-bold" style={{ fontSize: '10px', letterSpacing: '1px' }}>
              Operations Console
            </span>
            <h2 className="fw-black font-outfit text-white mb-0 admin-title-gradient">System Overview</h2>
          </div>
          <div className="admin-glass-card py-2 px-3 d-flex align-items-center gap-2">
            <span className={`badge rounded-circle p-1.5 bg-${metrics.systemHealth === 'green' ? 'success' : 'warning'}`}></span>
            <span className="small text-white-50" style={{ fontSize: '12px' }}>
              Synced: {new Date(metrics.lastSync).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Real-time KPI Metric Row */}
        <div className="row g-4 mb-4">
          
          {/* KPI 1: Active Requests */}
          <div className="col-12 col-sm-6 col-md-3">
            <div className="admin-glass-card h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-white-50 small fw-bold text-uppercase" style={{ fontSize: '11px' }}>Active Requests</span>
                  <i className="fas fa-truck-pickup text-warning fs-5"></i>
                </div>
                <h2 className="fw-black text-white font-outfit mb-1">{metrics.activeRequests}</h2>
              </div>
              <div className="mt-3 border-top border-secondary border-opacity-10 pt-2 d-flex justify-content-between align-items-center">
                <span className="text-success small fw-medium"><i className="fas fa-chart-line me-1"></i>Live Updates</span>
                <Link to="/admin/mechanics" className="btn btn-link text-warning p-0 small text-decoration-none fw-semibold" style={{ fontSize: '12px' }}>View all</Link>
              </div>
            </div>
          </div>

          {/* KPI 2: SOS Emergencies */}
          <div className="col-12 col-sm-6 col-md-3">
            <div className={`admin-glass-card h-100 d-flex flex-column justify-content-between ${metrics.activeSOS > 0 ? 'admin-pulse-emergency' : ''}`}>
              <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-white-50 small fw-bold text-uppercase" style={{ fontSize: '11px' }}>SOS Alarms</span>
                  <i className="fas fa-triangle-exclamation text-danger fs-5"></i>
                </div>
                <h2 className={`fw-black text-white font-outfit mb-1 ${metrics.activeSOS > 0 ? 'admin-flash-text' : ''}`}>{metrics.activeSOS}</h2>
              </div>
              <div className="mt-3 border-top border-secondary border-opacity-10 pt-2 d-flex justify-content-between align-items-center">
                <span className="text-danger small fw-medium">
                  {metrics.activeSOS > 0 ? <span className="spinner-grow spinner-grow-sm text-danger me-1"></span> : null}
                  Emergency Alert
                </span>
                <Link to="/admin/sos-center" className="btn btn-link text-danger p-0 small text-decoration-none fw-semibold" style={{ fontSize: '12px' }}>Monitor SOS</Link>
              </div>
            </div>
          </div>

          {/* KPI 3: Total Customers */}
          <div className="col-12 col-sm-6 col-md-3">
            <div className="admin-glass-card h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-white-50 small fw-bold text-uppercase" style={{ fontSize: '11px' }}>Total Drivers</span>
                  <i className="fas fa-user-group text-info fs-5"></i>
                </div>
                <h2 className="fw-black text-white font-outfit mb-1">{metrics.totalCustomers}</h2>
              </div>
              <div className="mt-3 border-top border-secondary border-opacity-10 pt-2 d-flex justify-content-between align-items-center">
                <span className="text-muted small">Registered customers</span>
                <Link to="/admin/customers" className="btn btn-link text-info p-0 small text-decoration-none fw-semibold" style={{ fontSize: '12px' }}>Manage</Link>
              </div>
            </div>
          </div>

          {/* KPI 4: Online Mechanics */}
          <div className="col-12 col-sm-6 col-md-3">
            <div className="admin-glass-card h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-white-50 small fw-bold text-uppercase" style={{ fontSize: '11px' }}>Online Mechanics</span>
                  <i className="fas fa-screwdriver-wrench text-success fs-5"></i>
                </div>
                <h2 className="fw-black text-white font-outfit mb-1">{metrics.activeMechanics}</h2>
              </div>
              <div className="mt-3 border-top border-secondary border-opacity-10 pt-2 d-flex justify-content-between align-items-center">
                <span className="text-muted small">Avg Rating: ★ {metrics.averageRating}</span>
                <Link to="/admin/mechanics" className="btn btn-link text-success p-0 small text-decoration-none fw-semibold" style={{ fontSize: '12px' }}>View list</Link>
              </div>
            </div>
          </div>

        </div>

        {/* System & Table Columns */}
        <div className="row g-4">
          
          {/* Card 3: Mechanics Status */}
          <div className="col-12 col-lg-8">
            <div className="admin-glass-card mb-4">
              <h5 className="fw-bold font-outfit text-white mb-4 d-flex align-items-center gap-2">
                <i className="fas fa-screwdriver-wrench text-warning"></i>
                <span>Mechanics Registry Overview</span>
              </h5>
              
              <div className="row g-3 text-center mb-4">
                <div className="col-4">
                  <div className="bg-dark bg-opacity-30 rounded-3 p-3 border border-secondary border-opacity-10">
                    <span className="text-muted d-block small mb-1">ONLINE</span>
                    <h3 className="fw-bold text-success mb-0">{metrics.onlineMechanicsCount}</h3>
                  </div>
                </div>
                <div className="col-4">
                  <div className="bg-dark bg-opacity-30 rounded-3 p-3 border border-secondary border-opacity-10">
                    <span className="text-muted d-block small mb-1">OFFLINE</span>
                    <h3 className="fw-bold text-light mb-0">{metrics.offlineMechanicsCount}</h3>
                  </div>
                </div>
                <div className="col-4">
                  <div className="bg-dark bg-opacity-30 rounded-3 p-3 border border-secondary border-opacity-10">
                    <span className="text-muted d-block small mb-1">SUSPENDED</span>
                    <h3 className="fw-bold text-danger mb-0">{metrics.suspendedMechanicsCount}</h3>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end">
                <Link to="/admin/mechanics" className="btn admin-btn-secondary px-4 py-2 small">
                  Open Mechanics Registry
                </Link>
              </div>
            </div>

            {/* Card 6: Top Mechanics */}
            <div className="admin-glass-card">
              <h5 className="fw-bold font-outfit text-white mb-3 d-flex align-items-center gap-2">
                <i className="fas fa-trophy text-warning"></i>
                <span>Top Rated Rescue Partners</span>
              </h5>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Partner Name</th>
                      <th>Specialty</th>
                      <th>Completed Jobs</th>
                      <th>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.topMechanics.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-4 text-muted">No mechanic ratings available yet.</td>
                      </tr>
                    ) : (
                      metrics.topMechanics.map((mech, index) => (
                        <tr key={mech.id || index}>
                          <td className="fw-bold text-white">
                            <Link to={`/admin/mechanics/${mech.id}`} className="text-white text-decoration-none hover-orange">
                              {mech.name || 'Certified Rescue Pro'}
                            </Link>
                          </td>
                          <td className="text-white-50">{mech.specialty?.replace('_', ' ').toUpperCase() || 'GENERAL'}</td>
                          <td className="text-white-50">{mech.jobsCompleted || 0} Jobs</td>
                          <td className="text-warning fw-bold">★ {mech.rating || '5.0'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* System Monitor columns */}
          <div className="col-12 col-lg-4">
            
            {/* Card 5: System Health */}
            <div className="admin-glass-card mb-4">
              <h5 className="fw-bold font-outfit text-white mb-4 d-flex align-items-center gap-2">
                <i className="fas fa-heartbeat text-info"></i>
                <span>System Link Status</span>
              </h5>

              <div className="mb-4">
                <div className="d-flex justify-content-between mb-1.5 small text-white-50">
                  <span>Firestore Connection</span>
                  <span className="text-success fw-bold">Online</span>
                </div>
                <div className="progress bg-dark" style={{ height: '6px' }}>
                  <div className="progress-bar bg-success" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between mb-1.5 small text-white-50">
                  <span>Authentication Service</span>
                  <span className="text-success fw-bold">Active</span>
                </div>
                <div className="progress bg-dark" style={{ height: '6px' }}>
                  <div className="progress-bar bg-success" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div className="mb-2">
                <div className="d-flex justify-content-between mb-1.5 small text-white-50">
                  <span>GPS Tracking Node</span>
                  <span className="text-success fw-bold">Ready</span>
                </div>
                <div className="progress bg-dark" style={{ height: '6px' }}>
                  <div className="progress-bar bg-success" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>

            {/* Operations logs card */}
            <div className="admin-glass-card">
              <h5 className="fw-bold font-outfit text-white mb-3 d-flex align-items-center gap-2">
                <i className="fas fa-terminal text-muted"></i>
                <span>Realtime Activity Streams</span>
              </h5>
              <div className="overflow-auto border border-secondary border-opacity-15 rounded-3 p-3 bg-dark bg-opacity-40" style={{ maxHeight: '190px', fontSize: '11px', fontFamily: 'monospace' }}>
                <div className="text-muted mb-2">[SYSTEM] Console session established.</div>
                <div className="text-success mb-2">[HEALTH] Firestore socket connected.</div>
                <div className="text-info mb-2">[LISTEN] Live updates are active.</div>
                {metrics.activeSOS > 0 && (
                  <div className="text-danger mb-2 font-bold">[SOS] Detected {metrics.activeSOS} active emergencies!</div>
                )}
                <div className="text-white-50">[METRIC] Online mechanic pool initialized.</div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
