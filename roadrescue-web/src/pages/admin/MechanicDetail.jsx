import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAdminMechanics } from '../../hooks/useAdminMechanics';
import { getAdminSession } from '../../services/adminAuthService';
import AdminNav from '../../components/admin/AdminNav';
import '../../styles/adminDashboard.css';

const MechanicDetail = () => {
  const { mechanicId } = useParams();
  const navigate = useNavigate();
  const adminSession = getAdminSession() || { uid: '' };

  const { 
    approveMechanic, 
    suspendMechanic, 
    unsuspendMechanic, 
    verifyMechanic, 
    unverifyMechanic, 
    updateMechanicData, 
    saveAdminNotes 
  } = useAdminMechanics();

  // Component States
  const [mechanic, setMechanic] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Edit Form states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSpecialty, setEditSpecialty] = useState('');
  const [editBio, setEditBio] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch mechanic profile
      const mechSnap = await getDoc(doc(db, 'mechanics', mechanicId));
      if (!mechSnap.exists()) {
        alert('Mechanic not found');
        navigate('/admin/mechanics');
        return;
      }
      const mechData = mechSnap.data();
      setMechanic({ id: mechSnap.id, ...mechData });
      setAdminNotes(mechData.adminNotes || '');

      // 2. Fetch corresponding users profile
      const userSnap = await getDoc(doc(db, 'users', mechanicId));
      if (userSnap.exists()) {
        setUserProfile(userSnap.data());
      }

      // 3. Fetch completed requests (jobs)
      const q = query(
        collection(db, 'requests'),
        where('mechanicId', '==', mechanicId)
      );
      const jobsSnap = await getDocs(q);
      const list = jobsSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      
      // Sort jobs locally in descending order
      list.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      setJobs(list);
    } catch (err) {
      console.error('Failed to load mechanic details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [mechanicId]);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await saveAdminNotes(mechanicId, adminNotes, adminSession.uid);
      alert('Notes saved successfully');
    } catch (err) {
      alert('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const openEditDialog = () => {
    setEditName(userProfile?.name || mechanic?.name || '');
    setEditPhone(userProfile?.phone || mechanic?.phone || '');
    setEditSpecialty(mechanic?.specialty || 'flat_tire');
    setEditBio(mechanic?.bio || '');
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    try {
      const payload = {
        specialty: editSpecialty,
        bio: editBio
      };
      await updateMechanicData(mechanicId, payload, adminSession.uid);
      
      // Also update name/phone in the hook
      await updateMechanicData(mechanicId, { name: editName, phone: editPhone }, adminSession.uid);

      setShowEditDialog(false);
      await loadData();
    } catch (err) {
      alert('Failed to update mechanic data');
    }
  };

  const handleApprove = async () => {
    if (window.confirm('Approve mechanic?')) {
      await approveMechanic(mechanicId, adminSession.uid);
      await loadData();
    }
  };

  const handleVerify = async () => {
    await verifyMechanic(mechanicId, adminSession.uid);
    await loadData();
  };

  const handleUnverify = async () => {
    await unverifyMechanic(mechanicId, adminSession.uid);
    await loadData();
  };

  if (loading) {
    return (
      <div className="admin-theme min-vh-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: '#0F1419' }}>
        <div className="spinner-border text-warning" role="status"></div>
      </div>
    );
  }

  const rating = parseFloat(mechanic?.rating) || 5.0;
  const isSuspended = mechanic?.status === 'suspended';

  return (
    <div className="admin-theme min-vh-100 pb-5" style={{ backgroundColor: '#0F1419' }}>
      <AdminNav />

      <div className="container-fluid px-4 py-4">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-4">
          <Link to="/admin/mechanics" className="text-decoration-none text-warning small fw-bold">
            <i className="fas fa-chevron-left me-1.5"></i> Back to Mechanics Registry
          </Link>
        </div>

        {/* Profile Card Summary */}
        <div className="row g-4 mb-4">
          <div className="col-12 col-lg-8">
            
            {/* Main Info */}
            <div className="admin-glass-card p-4 h-100">
              <div className="d-flex align-items-start gap-4 flex-wrap flex-sm-nowrap">
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.name || mechanic?.name || 'Pro Mechanic')}&background=FF6B35&color=fff&size=100`} 
                  alt="Avatar" 
                  className="rounded-circle border border-warning"
                  width="100"
                  height="100"
                />
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <h3 className="fw-bold text-white mb-0">{userProfile?.name || mechanic?.name}</h3>
                    {mechanic?.verified && <i className="fas fa-certificate text-info fs-5" title="Verified Professional"></i>}
                    
                    {/* Status Badge */}
                    {isSuspended ? (
                      <span className="admin-badge admin-badge-danger">SUSPENDED</span>
                    ) : mechanic?.status === 'pending_approval' ? (
                      <span className="admin-badge admin-badge-warning">PENDING</span>
                    ) : mechanic?.isOnline ? (
                      <span className="admin-badge admin-badge-success">ONLINE</span>
                    ) : (
                      <span className="admin-badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#A8A8A8', border: '1px solid rgba(255,255,255,0.1)' }}>OFFLINE</span>
                    )}
                  </div>

                  <span className="d-block text-white-50 mt-1 font-monospace small">ID: {mechanic?.id}</span>
                  
                  <div className="row g-3 mt-2 text-white-50">
                    <div className="col-12 col-sm-6">
                      <span className="d-block"><i className="fas fa-envelope text-warning me-2"></i> {userProfile?.email || 'No email registered'}</span>
                      <span className="d-block mt-1"><i className="fas fa-phone text-warning me-2"></i> {userProfile?.phone || 'No phone registered'}</span>
                    </div>
                    <div className="col-12 col-sm-6">
                      <span className="d-block"><i className="fas fa-briefcase text-warning me-2"></i> {mechanic?.specialty?.replace('_', ' ').toUpperCase() || 'GENERAL'}</span>
                      <span className="d-block mt-1"><i className="fas fa-clock text-warning me-2"></i> {mechanic?.experienceYears || 3} Yrs Experience</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio & Bio controls */}
              <div className="mt-4 border-top border-secondary border-opacity-10 pt-3 text-white-50">
                <span className="fw-bold text-white d-block mb-1">Rescue Bio</span>
                <p className="small mb-0 italic">{mechanic?.bio || 'Professional rescue partner dedicated to rapid help.'}</p>
              </div>

              {/* Action Toolbar */}
              <div className="mt-4 border-top border-secondary border-opacity-10 pt-3 d-flex gap-2 flex-wrap">
                <button className="btn admin-btn-primary small" onClick={openEditDialog}>
                  <i className="fas fa-edit me-1.5"></i> Edit Profile
                </button>
                {mechanic?.verified ? (
                  <button className="btn btn-outline-info small" onClick={handleUnverify}>
                    <i className="fas fa-certificate me-1.5"></i> Remove Verification
                  </button>
                ) : (
                  <button className="btn btn-info text-dark fw-bold small" onClick={handleVerify}>
                    <i className="fas fa-certificate me-1.5"></i> Grant Verification
                  </button>
                )}
                {mechanic?.status === 'pending_approval' && (
                  <button className="btn btn-success small" onClick={handleApprove}>
                    <i className="fas fa-check me-1.5"></i> Approve Registration
                  </button>
                )}
              </div>
            </div>

          </div>

          <div className="col-12 col-lg-4">
            
            {/* KPI Performance summary */}
            <div className="admin-glass-card p-4 mb-4">
              <h5 className="fw-bold font-outfit text-white mb-3">Performance Indicators</h5>
              
              <div className="mb-3 d-flex justify-content-between align-items-center">
                <span className="text-white-50 small">Customer Rating</span>
                <span className="text-warning fw-bold fs-5">★ {rating.toFixed(1)} / 5.0</span>
              </div>
              <div className="mb-3 d-flex justify-content-between align-items-center">
                <span className="text-white-50 small">Rescue Operations</span>
                <span className="text-white fw-bold">{jobs.length} completed</span>
              </div>
              <div className="mb-3 d-flex justify-content-between align-items-center">
                <span className="text-white-50 small">Location Node Status</span>
                <span className={mechanic?.latitude ? 'text-success' : 'text-muted'}>
                  {mechanic?.latitude ? 'Active GPS' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Admin Notes Section */}
            <div className="admin-glass-card p-4">
              <h5 className="fw-bold font-outfit text-white mb-3">Internal Admin Notes</h5>
              <textarea 
                className="form-control admin-input w-100 border-0 mb-3" 
                rows="4"
                placeholder="Log internal comments, notes on background verification, customer complaints..."
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

        {/* Jobs & Service History */}
        <div className="row g-4">
          <div className="col-12">
            <div className="admin-glass-card">
              <h5 className="fw-bold font-outfit text-white mb-3">Operations Log (Last 20 Jobs)</h5>
              
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Job ID</th>
                      <th>Customer Name</th>
                      <th>Service Details</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-muted">No jobs completed by this mechanic partner yet.</td>
                      </tr>
                    ) : (
                      jobs.slice(0, 20).map((job) => (
                        <tr key={job.id}>
                          <td className="fw-bold text-gradient-primary">#RR-{job.id.slice(0, 8).toUpperCase()}</td>
                          <td className="text-white">{job.customerName || 'RoadRescue Driver'}</td>
                          <td className="text-white-50">{job.issueType?.replace('_', ' ').toUpperCase() || 'GENERAL REPAIR'}</td>
                          <td className="text-white-50">
                            {job.createdAt?.seconds 
                              ? new Date(job.createdAt.seconds * 1000).toLocaleString() 
                              : 'Unknown Date'}
                          </td>
                          <td className="fw-bold text-white">₹{job.actualCost || job.estimatedCost || 500}</td>
                          <td>
                            <span className={`admin-badge ${['completed', 'reviewed', 'closed'].includes(job.status?.toLowerCase()) ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                              {job.status || 'COMPLETED'}
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

      {/* Edit Bio & Profile Dialog */}
      {showEditDialog && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content admin-glass-card">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-white">Edit Partner Details</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditDialog(false)}></button>
              </div>
              <div className="modal-body py-3">
                <div className="mb-3">
                  <label className="form-label text-white-50 small mb-1">Full Name</label>
                  <input 
                    type="text" 
                    className="form-control admin-input border-0" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label text-white-50 small mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    className="form-control admin-input border-0" 
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label text-white-50 small mb-1">Specialty</label>
                  <select 
                    className="form-select admin-input border-0"
                    value={editSpecialty}
                    onChange={(e) => setEditSpecialty(e.target.value)}
                  >
                    <option value="flat_tire">Flat Tire</option>
                    <option value="engine_breakdown">Engine Breakdown</option>
                    <option value="battery_jumpstart">Battery Jumpstart</option>
                    <option value="towing_service">Towing</option>
                  </select>
                </div>
                <div>
                  <label className="form-label text-white-50 small mb-1">Biography</label>
                  <textarea 
                    className="form-control admin-input border-0" 
                    rows="3"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn admin-btn-secondary" onClick={() => setShowEditDialog(false)}>Cancel</button>
                <button type="button" className="btn admin-btn-primary px-4" onClick={handleSaveEdit}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MechanicDetail;
