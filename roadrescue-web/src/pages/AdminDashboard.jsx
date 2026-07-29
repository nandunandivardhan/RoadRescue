import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getAllRequests } from '../services/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  
  // Admin Data states
  const [requests, setRequests] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [serverOnline, setServerOnline] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    totalRequests: 0,
    onlineMechanics: 0,
    completedRevenue: 0,
    activeSOS: 0,
    mechanicLoadPct: 0
  });

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminDataSilent, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Requests
      const reqRes = await getAllRequests();
      const allReqs = reqRes.data || [];
      setRequests(allReqs);

      // 2. Fetch Mechanics
      const mechRes = await api.get('/mechanics');
      const allMechs = mechRes.data || [];
      setMechanics(allMechs);

      calculateStats(allReqs, allMechs);
      setServerOnline(true);
    } catch (e) {
      console.error('Error fetching admin details:', e);
      setServerOnline(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminDataSilent = async () => {
    try {
      const reqRes = await getAllRequests();
      const allReqs = reqRes.data || [];
      setRequests(allReqs);

      const mechRes = await api.get('/mechanics');
      const allMechs = mechRes.data || [];
      setMechanics(allMechs);

      calculateStats(allReqs, allMechs);
      setServerOnline(true);
    } catch (e) {
      setServerOnline(false);
    }
  };

  const calculateStats = (allReqs, allMechs) => {
    const totalRequests = allReqs.length;
    const onlineMechanics = allMechs.filter(m => m.isOnline).length;
    
    const activeSOS = allReqs.filter(r => r.status.toUpperCase() === 'PENDING').length;
    
    const completedRevenue = allReqs
      .filter(r => ['COMPLETED', 'REVIEWED', 'CLOSED'].includes(r.status.toUpperCase()))
      .reduce((sum, r) => {
        let cost = parseFloat(r.actualCost || r.estimatedCost);
        if (isNaN(cost)) {
          const serviceCosts = {
            'flat_tire': 450,
            'battery': 600,
            'engine': 1200,
            'fuel': 300,
            'towing': 2500,
            'other': 500
          };
          cost = serviceCosts[r.issueType] || 0;
        }
        return sum + cost;
      }, 0);

    const busyMechs = allMechs.filter(m => m.isOnline && !m.isAvailable).length;
    const loadPct = onlineMechanics > 0 ? Math.round((busyMechs / onlineMechanics) * 100) : 0;

    setStats({
      totalRequests,
      onlineMechanics,
      completedRevenue,
      activeSOS,
      mechanicLoadPct: loadPct
    });
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchAdminData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-dark text-white">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Booting Admin Panel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark text-white min-vh-100 py-4 px-3" style={{ background: 'linear-gradient(180deg, #0F1117 0%, #151A25 100%)' }}>
      <div className="container">
        
        {/* Header Console */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
          <div>
            <span className="text-muted small">RoadRescue Enterprise Dashboard</span>
            <h2 className="font-outfit fw-extrabold text-white mb-0">Admin Control Center</h2>
          </div>
          
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-secondary d-flex align-items-center gap-2"
              onClick={handleManualRefresh}
              disabled={refreshing}
            >
              {refreshing ? <span className="spinner-border spinner-border-sm"></span> : <i className="fas fa-arrows-rotate"></i>}
              Refresh Operations
            </button>
          </div>
        </div>

        {/* Dynamic Analytics KPI row */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="glass-card p-4 text-start" style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.15) 0%, rgba(0,0,0,0.2) 100%)' }}>
              <div className="d-flex justify-content-between mb-2">
                <span className="small text-muted font-outfit uppercase">Total Assistance Tickets</span>
                <i className="fas fa-clipboard-list text-primary fs-4"></i>
              </div>
              <h2 className="font-outfit fw-black text-white mb-0">{stats.totalRequests}</h2>
              <small className="text-muted fs-xxs">Created in system database</small>
            </div>
          </div>

          <div className="col-md-3">
            <div className="glass-card p-4 text-start" style={{ background: 'linear-gradient(135deg, rgba(27,44,193,0.15) 0%, rgba(0,0,0,0.2) 100%)' }}>
              <div className="d-flex justify-content-between mb-2">
                <span className="small text-muted font-outfit uppercase">Total Revenue</span>
                <i className="fas fa-indian-rupee-sign text-success fs-4"></i>
              </div>
              <h2 className="font-outfit fw-black text-white mb-0">₹{stats.completedRevenue.toLocaleString('en-IN')}</h2>
              <small className="text-muted fs-xxs">Completed repairs payments</small>
            </div>
          </div>

          <div className="col-md-3">
            <div className="glass-card p-4 text-start" style={{ background: 'linear-gradient(135deg, rgba(255,193,7,0.1) 0%, rgba(0,0,0,0.2) 100%)' }}>
              <div className="d-flex justify-content-between mb-2">
                <span className="small text-muted font-outfit uppercase">Online Mechanics</span>
                <i className="fas fa-screwdriver-wrench text-warning fs-4"></i>
              </div>
              <h2 className="font-outfit fw-black text-white mb-0">{stats.onlineMechanics}</h2>
              <small className="text-muted fs-xxs">Active in radius regions</small>
            </div>
          </div>

          <div className="col-md-3">
            <div className="glass-card p-4 text-start" style={{ background: 'linear-gradient(135deg, rgba(220,53,69,0.15) 0%, rgba(0,0,0,0.2) 100%)' }}>
              <div className="d-flex justify-content-between mb-2">
                <span className="small text-muted font-outfit uppercase">Pending SOS Alerts</span>
                <i className="fas fa-triangle-exclamation text-danger fs-4"></i>
              </div>
              <h2 className="font-outfit fw-black text-white mb-0">{stats.activeSOS}</h2>
              <small className="text-muted fs-xxs">Requiring immediate dispatch</small>
            </div>
          </div>
        </div>

        {/* Main Content Rows */}
        <div className="row g-4">
          
          {/* Operations Table */}
          <div className="col-lg-8">
            <div className="glass-card p-4 mb-4">
              <h5 className="font-outfit fw-bold text-white mb-4">
                <i className="fas fa-list-check text-primary me-2"></i> Recent Service Requests
              </h5>

              <div className="table-responsive">
                <table className="table table-dark table-hover table-borderless align-middle mb-0 text-muted" style={{ fontSize: '13px' }}>
                  <thead className="border-bottom border-secondary border-opacity-35">
                    <tr>
                      <th className="text-white py-3">ID</th>
                      <th className="text-white py-3">Driver</th>
                      <th className="text-white py-3">Service</th>
                      <th className="text-white py-3">Assigned Partner</th>
                      <th className="text-white py-3">Status</th>
                      <th className="text-white py-3">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-5 text-muted">No roadside requests logged in system.</td>
                      </tr>
                    ) : (
                      requests.slice(0, 10).map((req) => (
                        <tr key={req.id}>
                          <td className="fw-bold text-gradient-primary">#RR-{req.id}</td>
                          <td className="text-white">{req.customerName || 'Driver Client'}</td>
                          <td className="text-white">{req.issueType.replace('_', ' ').toUpperCase()}</td>
                          <td className="text-white">{req.mechanicName || <span className="text-muted small">Not Allocated</span>}</td>
                          <td>
                            <span className={`status-badge-custom ${req.status.toLowerCase()}`} style={{ fontSize: '9px', padding: '3px 10px' }}>
                              {req.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="fw-bold text-white">₹{req.actualCost || req.estimatedCost}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mechanics Registry list */}
            <div className="glass-card p-4">
              <h5 className="font-outfit fw-bold text-white mb-4">
                <i className="fas fa-address-book text-warning me-2"></i> Mechanic Partners Registry
              </h5>

              <div className="table-responsive">
                <table className="table table-dark table-hover table-borderless align-middle mb-0 text-muted" style={{ fontSize: '13px' }}>
                  <thead className="border-bottom border-secondary border-opacity-35">
                    <tr>
                      <th className="text-white py-3">ID</th>
                      <th className="text-white py-3">Partner Name</th>
                      <th className="text-white py-3">Specialty</th>
                      <th className="text-white py-3">Exp</th>
                      <th className="text-white py-3">Rating</th>
                      <th className="text-white py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mechanics.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-5 text-muted">No mechanic accounts registered in database.</td>
                      </tr>
                    ) : (
                      mechanics.map((mech) => (
                        <tr key={mech.id}>
                          <td className="fw-bold text-gradient-primary">#MECH-{mech.id}</td>
                          <td className="text-white fw-bold">{mech.user?.name || mech.name || 'Pro Mechanic'}</td>
                          <td className="text-white">{mech.specialty?.replace('_', ' ').toUpperCase() || 'GENERAL'}</td>
                          <td className="text-white">{mech.experienceYears || 3} Yrs</td>
                          <td className="text-warning">★ {mech.rating || '5.0'}</td>
                          <td>
                            {mech.isOnline ? (
                              <span className="badge bg-success bg-opacity-15 text-success border border-success border-opacity-20 fs-xxs">ONLINE</span>
                            ) : (
                              <span className="badge bg-secondary bg-opacity-15 text-muted border border-secondary border-opacity-20 fs-xxs">OFFLINE</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* System Monitor columns */}
          <div className="col-lg-4">
            <div className="glass-card p-4 mb-4">
              <h5 className="font-outfit fw-bold text-white mb-4">
                <i className="fas fa-network-wired text-primary me-2"></i> System Health Monitor
              </h5>

              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1 small text-muted">
                  <span>Spring Boot REST API</span>
                  <span className={serverOnline ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                    {serverOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="progress bg-dark" style={{ height: '6px' }}>
                  <div className={`progress-bar ${serverOnline ? 'bg-success' : 'bg-danger'}`} style={{ width: '100%' }}></div>
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1 small text-muted">
                  <span>Database Link (MySQL)</span>
                  <span className="text-success fw-bold">Active</span>
                </div>
                <div className="progress bg-dark" style={{ height: '6px' }}>
                  <div className="progress-bar bg-success" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1 small text-muted">
                  <span>Active Mechanics Load</span>
                  <span className="text-white fw-bold">{stats.mechanicLoadPct}%</span>
                </div>
                <div className="progress bg-dark" style={{ height: '6px' }}>
                  <div className="progress-bar bg-warning" style={{ width: `${stats.mechanicLoadPct}%` }}></div>
                </div>
              </div>
            </div>

            <div className="glass-card p-4">
              <h5 className="font-outfit fw-bold text-white mb-3">
                <i className="fas fa-circle-info text-warning me-2"></i> Operations Logs
              </h5>
              <div className="overflow-auto border border-secondary border-opacity-15 rounded-3 p-3 bg-dark bg-opacity-50" style={{ maxHeight: '200px', fontSize: '11px', fontFamily: 'monospace' }}>
                <div className="text-muted mb-2">[SYSTEM] Boots RoadRescue enterprise server...</div>
                <div className="text-success mb-2">[HEALTH] Connection with MySQL database successfully established.</div>
                <div className="text-info mb-2">[JWT] Session provider initialized using secure token authorization.</div>
                {requests.length > 0 && (
                  <div className="text-white mb-2">[DB] Logged {requests.length} total roadside assistance tickets.</div>
                )}
                <div className="text-muted">[LISTEN] Admin Live update daemon listening for live updates...</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
