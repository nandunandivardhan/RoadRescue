import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAdminCustomers } from '../../hooks/useAdminCustomers';
import { getAdminSession } from '../../services/adminAuthService';
import AdminNav from '../../components/admin/AdminNav';
import '../../styles/adminDashboard.css';

const CustomerDetail = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const adminSession = getAdminSession() || { uid: '' };

  const { 
    disableCustomer, 
    enableCustomer, 
    warnCustomer, 
    saveCustomerNotes 
  } = useAdminCustomers();

  // Component States
  const [customer, setCustomer] = useState(null);
  const [requests, setRequests] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Dialog States
  const [showWarnDialog, setShowWarnDialog] = useState(false);
  const [warnReason, setWarnReason] = useState('Disrespectful behavior');
  const [warnMessage, setWarnMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch user profile
      const userSnap = await getDoc(doc(db, 'users', customerId));
      if (!userSnap.exists()) {
        alert('Customer not found');
        navigate('/admin/customers');
        return;
      }
      const data = userSnap.data();
      setCustomer({ id: userSnap.id, ...data });
      setAdminNotes(data.adminNotes || '');

      // 2. Fetch customer requests
      const q = query(
        collection(db, 'requests'),
        where('customerId', '==', customerId)
      );
      const reqsSnap = await getDocs(q);
      const list = reqsSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      
      // Sort in memory to avoid index requirements
      list.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      setRequests(list);

      // 3. Fetch emergency contacts
      const ecQuery = query(
        collection(db, 'emergencyContacts'),
        where('customerId', '==', customerId)
      );
      const ecSnap = await getDocs(ecQuery);
      setEmergencyContacts(ecSnap.docs.map(docSnap => docSnap.data()));

    } catch (err) {
      console.error('Failed to load customer details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [customerId]);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await saveCustomerNotes(customerId, adminNotes, adminSession.uid);
      alert('Customer notes saved successfully.');
    } catch (err) {
      alert('Failed to save customer notes.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDisableToggle = async () => {
    const isSuspended = customer?.accountStatus === 'disabled';
    if (isSuspended) {
      if (window.confirm('Enable this customer account?')) {
        await enableCustomer(customerId, adminSession.uid);
        await loadData();
      }
    } else {
      if (window.confirm('Disable this customer account?')) {
        await disableCustomer(customerId, 'Abusive behavior', adminSession.uid);
        await loadData();
      }
    }
  };

  const submitWarning = async () => {
    await warnCustomer(customerId, warnReason, warnMessage, adminSession.uid);
    setShowWarnDialog(false);
    await loadData();
  };

  if (loading) {
    return (
      <div className="admin-theme min-vh-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: '#0F1419' }}>
        <div className="spinner-border text-warning" role="status"></div>
      </div>
    );
  }

  const isSuspended = customer?.accountStatus === 'disabled';
  const strikeCount = (customer?.warnings || []).length;
  const sosRequestsCount = requests.filter(r => r.isSOS || r.priority === 'SOS' || r.priority === 'sos').length;

  return (
    <div className="admin-theme min-vh-100 pb-5" style={{ backgroundColor: '#0F1419' }}>
      <AdminNav />

      <div className="container-fluid px-4 py-4">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-4">
          <Link to="/admin/customers" className="text-decoration-none text-warning small fw-bold">
            <i className="fas fa-chevron-left me-1.5"></i> Back to Customer Directory
          </Link>
        </div>

        {/* Profile Card Summary */}
        <div className="row g-4 mb-4">
          <div className="col-12 col-lg-8">
            
            {/* Info card */}
            <div className="admin-glass-card p-4 h-100">
              <div className="d-flex align-items-start gap-4 flex-wrap flex-sm-nowrap">
                <img 
                  src={customer?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer?.fullName || 'RoadRescue Customer')}&background=FF6B35&color=fff&size=100`} 
                  alt="Avatar" 
                  className="rounded-circle border border-warning"
                  width="100"
                  height="100"
                />
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <h3 className="fw-bold text-white mb-0">{customer?.fullName}</h3>
                    
                    {/* Status Badge */}
                    {isSuspended ? (
                      <span className="admin-badge admin-badge-danger">DISABLED</span>
                    ) : (
                      <span className="admin-badge admin-badge-success">ACTIVE</span>
                    )}
                  </div>

                  <span className="d-block text-white-50 mt-1 font-monospace small">ID: {customer?.id}</span>
                  
                  <div className="row g-3 mt-2 text-white-50">
                    <div className="col-12 col-sm-6">
                      <span className="d-block"><i className="fas fa-envelope text-warning me-2"></i> {customer?.email || 'No email registered'}</span>
                      <span className="d-block mt-1"><i className="fas fa-phone text-warning me-2"></i> {customer?.phone || 'No phone registered'}</span>
                    </div>
                    <div className="col-12 col-sm-6">
                      <span className="d-block"><i className="fas fa-calendar-check text-warning me-2"></i> Registered: {customer?.createdAt?.seconds ? new Date(customer.createdAt.seconds * 1000).toLocaleDateString() : 'Active Member'}</span>
                      <span className="d-block mt-1"><i className="fas fa-shield text-warning me-2"></i> Role: Customer / Driver</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warnings strikes history log */}
              <div className="mt-4 border-top border-secondary border-opacity-10 pt-3">
                <h6 className="fw-bold text-white mb-2">Warning Strikes Log ({strikeCount} / 3)</h6>
                {strikeCount === 0 ? (
                  <p className="text-success small mb-0"><i className="fas fa-circle-check me-1.5"></i> This account has a perfectly clean record. No strikes issued.</p>
                ) : (
                  <div className="list-group bg-transparent gap-2">
                    {customer.warnings.map((warn, index) => (
                      <div key={index} className="list-group-item bg-dark bg-opacity-30 border border-warning border-opacity-20 rounded-3 text-white-50 small p-2.5">
                        <div className="d-flex justify-content-between">
                          <strong className="text-warning">{warn.reason}</strong>
                          <span className="text-muted" style={{ fontSize: '10px' }}>{new Date(warn.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="mb-0 mt-1">{warn.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="mt-4 border-top border-secondary border-opacity-10 pt-3 d-flex gap-2 flex-wrap">
                <button className="btn admin-btn-secondary small" onClick={() => setShowWarnDialog(true)}>
                  <i className="fas fa-triangle-exclamation me-1.5"></i> Issue Warning Strike
                </button>
                <button 
                  className={`btn small ${isSuspended ? 'btn-success' : 'btn-danger'}`}
                  onClick={handleDisableToggle}
                >
                  {isSuspended ? (
                    <>
                      <i className="fas fa-user-check me-1.5"></i> Re-enable Customer Account
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-slash me-1.5"></i> Disable Customer Account
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

          <div className="col-12 col-lg-4">
            
            {/* KPI Performance summary */}
            <div className="admin-glass-card p-4 mb-4">
              <h5 className="fw-bold font-outfit text-white mb-3">Customer Activity</h5>
              
              <div className="mb-3 d-flex justify-content-between align-items-center">
                <span className="text-white-50 small">Total Requests Logged</span>
                <span className="text-white fw-bold fs-5">{requests.length} Requests</span>
              </div>
              <div className="mb-3 d-flex justify-content-between align-items-center">
                <span className="text-white-50 small">Emergency SOS Triggers</span>
                <span className={`fw-bold fs-5 ${sosRequestsCount > 0 ? 'text-danger' : 'text-success'}`}>{sosRequestsCount} SOS Alarms</span>
              </div>
              
              {/* Registered Emergency Contacts */}
              <div className="mt-4 border-top border-secondary border-opacity-10 pt-3">
                <span className="fw-bold text-white d-block mb-2">Emergency Contacts ({emergencyContacts.length})</span>
                {emergencyContacts.length === 0 ? (
                  <span className="text-muted small">No emergency contacts registered.</span>
                ) : (
                  emergencyContacts.map((contact, index) => (
                    <div key={index} className="bg-dark bg-opacity-20 border border-secondary border-opacity-15 rounded-3 p-2 mb-2">
                      <strong className="d-block text-white small">{contact.name || contact.fullName}</strong>
                      <span className="text-white-50 small"><i className="fas fa-phone me-1 text-warning"></i> {contact.phone || contact.phoneNumber}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Admin Notes Section */}
            <div className="admin-glass-card p-4">
              <h5 className="fw-bold font-outfit text-white mb-3">Internal Admin Comments</h5>
              <textarea 
                className="form-control admin-input w-100 border-0 mb-3" 
                rows="4"
                placeholder="Log notes about abusive behaviour, bad ratings, suspicious SOS triggers..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
              <button 
                className="btn admin-btn-primary btn-sm w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                onClick={handleSaveNotes}
                disabled={savingNotes}
              >
                {savingNotes ? <span className="spinner-border spinner-border-sm"></span> : <i className="fas fa-save"></i>}
                <span>Save Notes</span>
              </button>
            </div>

          </div>
        </div>

        {/* Requests & Service History */}
        <div className="row g-4">
          <div className="col-12">
            <div className="admin-glass-card">
              <h5 className="fw-bold font-outfit text-white mb-3">Service Requests History (Last 20 Requests)</h5>
              
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Service Details</th>
                      <th>Rescue Location</th>
                      <th>Assigned Partner</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-muted">No roadside help requests made by this driver.</td>
                      </tr>
                    ) : (
                      requests.slice(0, 20).map((req) => (
                        <tr key={req.id}>
                          <td className="fw-bold text-gradient-primary">#RR-{req.id.slice(0, 8).toUpperCase()}</td>
                          <td className="text-white">
                            <span className="d-block">{req.issueType?.replace('_', ' ').toUpperCase() || 'GENERAL REPAIR'}</span>
                            {req.isSOS && <span className="admin-badge admin-badge-danger" style={{ fontSize: '8px', padding: '1px 5px' }}>EMERGENCY SOS</span>}
                          </td>
                          <td className="text-white-50">{req.pickupAddress || 'Unknown location'}</td>
                          <td className="text-white-50">{req.mechanicName || <span className="text-muted">Not assigned</span>}</td>
                          <td className="text-white-50">
                            {req.createdAt?.seconds 
                              ? new Date(req.createdAt.seconds * 1000).toLocaleString() 
                              : 'Unknown Date'}
                          </td>
                          <td className="fw-bold text-white">₹{req.actualCost || req.estimatedCost || 500}</td>
                          <td>
                            <span className={`admin-badge ${['completed', 'reviewed', 'closed'].includes(req.status?.toLowerCase()) ? 'admin-badge-success' : req.status === 'pending' ? 'admin-badge-warning' : 'admin-badge-danger'}`}>
                              {req.status || 'COMPLETED'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Warning Strike Dialog Modal */}
      {showWarnDialog && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content admin-glass-card border-warning border-opacity-30">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-white">Issue Strike Warning</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowWarnDialog(false)}></button>
              </div>
              <div className="modal-body py-3">
                <div className="mb-3">
                  <label className="form-label text-white-50 small mb-1">Reason (Strike category)</label>
                  <select 
                    className="form-select admin-input border-0"
                    value={warnReason}
                    onChange={(e) => setWarnReason(e.target.value)}
                  >
                    <option value="Disrespectful behavior">Disrespectful behavior</option>
                    <option value="False SOS">False SOS emergency trigger</option>
                    <option value="Complaint received">Customer complaint</option>
                    <option value="Policy violation">Policy violation</option>
                  </select>
                </div>
                <div>
                  <label className="form-label text-white-50 small mb-1">Strike Details / Message</label>
                  <textarea 
                    className="form-control admin-input border-0" 
                    rows="3"
                    placeholder="Describe issue (e.g. Triggered SOS alert for general flat tire query)"
                    value={warnMessage}
                    onChange={(e) => setWarnMessage(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn admin-btn-secondary" onClick={() => setShowWarnDialog(false)}>Cancel</button>
                <button 
                  type="button" 
                  className="btn btn-warning px-4 text-dark fw-bold" 
                  onClick={submitWarning}
                  disabled={!warnMessage}
                >
                  Confirm Strike Warning
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerDetail;
