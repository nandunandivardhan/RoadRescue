import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminNav from '../../components/admin/AdminNav';
import { useAdminMechanics } from '../../hooks/useAdminMechanics';
import { getAdminSession } from '../../services/adminAuthService';
import '../../styles/adminDashboard.css';

const MechanicManagement = () => {
  const { 
    mechanics, 
    loading, 
    approveMechanic, 
    rejectMechanic, 
    suspendMechanic, 
    unsuspendMechanic, 
    verifyMechanic, 
    unverifyMechanic 
  } = useAdminMechanics();

  const adminSession = getAdminSession() || { uid: '' };

  // Local UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Dialog States
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [selectedMechId, setSelectedMechId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [suspensionReason, setSuspensionReason] = useState('Low ratings');
  const [suspensionDuration, setSuspensionDuration] = useState('7');

  // 1. Filter mechanics list
  const filteredMechanics = mechanics.filter(mech => {
    const nameMatch = mech.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const phoneMatch = (mech.phone || '').includes(searchTerm);
    const specMatch = (mech.specialty || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = nameMatch || phoneMatch || specMatch;

    let matchesStatus = true;
    if (statusFilter === 'online') matchesStatus = mech.isOnline === true;
    else if (statusFilter === 'offline') matchesStatus = mech.isOnline !== true && mech.status !== 'suspended';
    else if (statusFilter === 'suspended') matchesStatus = mech.status === 'suspended';
    else if (statusFilter === 'pending_approval') matchesStatus = mech.status === 'pending_approval' || !mech.status;

    let matchesSpecialty = true;
    if (specialtyFilter !== 'all') {
      matchesSpecialty = (mech.specialty || '').toLowerCase() === specialtyFilter.toLowerCase();
    }

    let matchesRating = true;
    const rating = parseFloat(mech.rating) || 5.0;
    if (ratingFilter === '4.5') matchesRating = rating >= 4.5;
    else if (ratingFilter === '4.0') matchesRating = rating >= 4.0;
    else if (ratingFilter === '3.5') matchesRating = rating >= 3.5;

    return matchesSearch && matchesStatus && matchesSpecialty && matchesRating;
  });

  // 2. Sort mechanics list
  const sortedMechanics = [...filteredMechanics].sort((a, b) => {
    if (sortBy === 'name') {
      return a.fullName.localeCompare(b.fullName);
    } else if (sortBy === 'rating') {
      return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
    } else if (sortBy === 'jobs') {
      return (b.jobsCompleted || 0) - (a.jobsCompleted || 0);
    } else if (sortBy === 'experience') {
      return (b.experienceYears || 0) - (a.experienceYears || 0);
    }
    return 0;
  });

  // 3. Paginate
  const totalItems = sortedMechanics.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMechanics = sortedMechanics.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleApprove = async (id) => {
    if (window.confirm('Approve this mechanic credentials?')) {
      await approveMechanic(id, adminSession.uid);
    }
  };

  const handleVerifyToggle = async (mech) => {
    if (mech.verified) {
      await unverifyMechanic(mech.id, adminSession.uid);
    } else {
      await verifyMechanic(mech.id, adminSession.uid);
    }
  };

  const openRejectDialog = (id) => {
    setSelectedMechId(id);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const submitRejection = async () => {
    if (!rejectionReason) return;
    await rejectMechanic(selectedMechId, rejectionReason, adminSession.uid);
    setShowRejectDialog(false);
  };

  const openSuspendDialog = (id) => {
    setSelectedMechId(id);
    setSuspensionReason('Low ratings');
    setSuspensionDuration('7');
    setShowSuspendDialog(true);
  };

  const submitSuspension = async () => {
    await suspendMechanic(selectedMechId, suspensionReason, suspensionDuration, adminSession.uid);
    setShowSuspendDialog(false);
  };

  const handleUnsuspend = async (id) => {
    if (window.confirm('Unsuspend this mechanic account?')) {
      await unsuspendMechanic(id, adminSession.uid);
    }
  };

  return (
    <div className="admin-theme min-vh-100 pb-5" style={{ backgroundColor: '#0F1419' }}>
      <AdminNav />

      <div className="container-fluid px-4 py-4">
        
        {/* Header */}
        <div className="mb-4">
          <span className="text-uppercase text-muted fw-bold" style={{ fontSize: '10px', letterSpacing: '1px' }}>
            System Registry
          </span>
          <h2 className="fw-black font-outfit text-white mb-0 admin-title-gradient">Mechanic Partners</h2>
        </div>

        {/* Filters Panel */}
        <div className="admin-glass-card p-3 mb-4">
          <div className="row g-3">
            
            {/* Search */}
            <div className="col-12 col-md-4">
              <label className="small text-white-50 mb-1 fw-medium">Search Mechanics</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-0 text-white-50"><i className="fas fa-search"></i></span>
                <input 
                  type="text" 
                  className="form-control admin-input border-0" 
                  placeholder="Search by name, phone, specialty..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>

            {/* Filter Status */}
            <div className="col-6 col-md-2">
              <label className="small text-white-50 mb-1 fw-medium">Status</label>
              <select 
                className="form-select admin-input border-0"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">All Statuses</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="suspended">Suspended</option>
                <option value="pending_approval">Pending Approval</option>
              </select>
            </div>

            {/* Filter Specialty */}
            <div className="col-6 col-md-2">
              <label className="small text-white-50 mb-1 fw-medium">Specialty</label>
              <select 
                className="form-select admin-input border-0"
                value={specialtyFilter}
                onChange={(e) => { setSpecialtyFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">All Specialties</option>
                <option value="flat_tire">Flat Tire</option>
                <option value="engine_breakdown">Engine Breakdown</option>
                <option value="battery_jumpstart">Battery Jumpstart</option>
                <option value="towing_service">Towing</option>
              </select>
            </div>

            {/* Filter Rating */}
            <div className="col-6 col-md-2">
              <label className="small text-white-50 mb-1 fw-medium">Rating</label>
              <select 
                className="form-select admin-input border-0"
                value={ratingFilter}
                onChange={(e) => { setRatingFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">Any Rating</option>
                <option value="4.5">★ 4.5+</option>
                <option value="4.0">★ 4.0+</option>
                <option value="3.5">★ 3.5+</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="col-6 col-md-2">
              <label className="small text-white-50 mb-1 fw-medium">Sort By</label>
              <select 
                className="form-select admin-input border-0"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Name</option>
                <option value="rating">Rating</option>
                <option value="jobs">Jobs Completed</option>
                <option value="experience">Experience</option>
              </select>
            </div>

          </div>
        </div>

        {/* Mechanics Registry Table */}
        <div className="admin-glass-card p-0 overflow-hidden mb-4">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-warning" role="status"></div>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Partner Name</th>
                    <th>Phone / Email</th>
                    <th>Specialty</th>
                    <th>Experience</th>
                    <th>Rating</th>
                    <th>Jobs</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMechanics.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-5 text-muted">No mechanic partners found matching filters.</td>
                    </tr>
                  ) : (
                    currentMechanics.map((mech) => (
                      <tr key={mech.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span className="fw-bold text-white">
                              <Link to={`/admin/mechanics/${mech.id}`} className="text-white text-decoration-none hover-orange">
                                {mech.fullName}
                              </Link>
                            </span>
                            {mech.verified && <i className="fas fa-certificate text-info" title="Verified Professional" style={{ fontSize: '12px' }}></i>}
                          </div>
                          <span className="text-muted d-block" style={{ fontSize: '10px', fontFamily: 'monospace' }}>ID: {mech.id.slice(0, 8)}...</span>
                        </td>
                        <td>
                          <span className="d-block text-white-50">{mech.phone || 'No phone'}</span>
                          <span className="d-block text-muted small">{mech.email || 'No email'}</span>
                        </td>
                        <td>
                          <span className="admin-badge admin-badge-info">
                            {mech.specialty?.replace('_', ' ').toUpperCase() || 'GENERAL'}
                          </span>
                        </td>
                        <td className="text-white-50">{mech.experienceYears || 3} Yrs</td>
                        <td className="text-warning fw-bold">★ {mech.rating || '5.0'}</td>
                        <td className="text-white-50">{mech.jobsCompleted || 0} completed</td>
                        <td>
                          {mech.status === 'suspended' ? (
                            <span className="admin-badge admin-badge-danger">SUSPENDED</span>
                          ) : mech.status === 'pending_approval' || !mech.status ? (
                            <span className="admin-badge admin-badge-warning">PENDING APPROVAL</span>
                          ) : mech.isOnline ? (
                            <span className="admin-badge admin-badge-success">ONLINE</span>
                          ) : (
                            <span className="admin-badge admin-badge-info" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#A8A8A8', border: '1px solid rgba(255,255,255,0.1)' }}>OFFLINE</span>
                          )}
                        </td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-1">
                            <Link to={`/admin/mechanics/${mech.id}`} className="btn btn-outline-info btn-xs py-1 px-2.5" style={{ fontSize: '11px', borderRadius: '5px' }}>
                              Details
                            </Link>
                            
                            {/* Verification Badge Toggle */}
                            <button 
                              className={`btn btn-xs py-1 px-2.5 ${mech.verified ? 'btn-outline-secondary' : 'btn-outline-info'}`}
                              onClick={() => handleVerifyToggle(mech)}
                              style={{ fontSize: '11px', borderRadius: '5px' }}
                            >
                              {mech.verified ? 'Unverify' : 'Verify'}
                            </button>

                            {/* Pending approvals triggers */}
                            {(mech.status === 'pending_approval' || !mech.status) ? (
                              <>
                                <button className="btn btn-success btn-xs py-1 px-2.5" onClick={() => handleApprove(mech.id)} style={{ fontSize: '11px', borderRadius: '5px' }}>
                                  Approve
                                </button>
                                <button className="btn btn-danger btn-xs py-1 px-2.5" onClick={() => openRejectDialog(mech.id)} style={{ fontSize: '11px', borderRadius: '5px' }}>
                                  Reject
                                </button>
                              </>
                            ) : mech.status === 'suspended' ? (
                              <button className="btn btn-success btn-xs py-1 px-2.5" onClick={() => handleUnsuspend(mech.id)} style={{ fontSize: '11px', borderRadius: '5px' }}>
                                Unsuspend
                              </button>
                            ) : (
                              <button className="btn btn-outline-danger btn-xs py-1 px-2.5" onClick={() => openSuspendDialog(mech.id)} style={{ fontSize: '11px', borderRadius: '5px' }}>
                                Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Console */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center gap-2">
            <button 
              className="btn admin-btn-secondary py-1.5 px-3"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Prev
            </button>
            <span className="align-self-center text-white-50 small">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              className="btn admin-btn-secondary py-1.5 px-3"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </button>
          </div>
        )}

      </div>

      {/* Reject Modal dialog */}
      {showRejectDialog && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content admin-glass-card border-danger border-opacity-30">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-white">Reject Application</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowRejectDialog(false)}></button>
              </div>
              <div className="modal-body py-3">
                <label className="form-label text-white-50 small mb-1">Reason for Rejection (required)</label>
                <textarea 
                  className="form-control admin-input w-100 border-0" 
                  rows="3"
                  placeholder="Provide brief reason (e.g. Invalid documents, background check failed)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn admin-btn-secondary" onClick={() => setShowRejectDialog(false)}>Cancel</button>
                <button 
                  type="button" 
                  className="btn btn-danger px-4" 
                  onClick={submitRejection}
                  disabled={!rejectionReason}
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspension Modal dialog */}
      {showSuspendDialog && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content admin-glass-card border-danger border-opacity-30">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-white">Suspend Partner Account</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowSuspendDialog(false)}></button>
              </div>
              <div className="modal-body py-3">
                <div className="mb-3">
                  <label className="form-label text-white-50 small mb-1">Suspension Reason</label>
                  <select 
                    className="form-select admin-input border-0"
                    value={suspensionReason}
                    onChange={(e) => setSuspensionReason(e.target.value)}
                  >
                    <option value="Abusive behavior">Abusive behavior</option>
                    <option value="Low ratings">Low ratings</option>
                    <option value="Unresponsive">Unresponsive</option>
                    <option value="Fraud">Fraud</option>
                    <option value="Policy violation">Policy violation</option>
                  </select>
                </div>
                <div>
                  <label className="form-label text-white-50 small mb-1">Duration</label>
                  <select 
                    className="form-select admin-input border-0"
                    value={suspensionDuration}
                    onChange={(e) => setSuspensionDuration(e.target.value)}
                  >
                    <option value="1">1 Day</option>
                    <option value="7">7 Days</option>
                    <option value="30">30 Days</option>
                    <option value="365">Permanent (1 Year)</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn admin-btn-secondary" onClick={() => setShowSuspendDialog(false)}>Cancel</button>
                <button type="button" className="btn btn-danger px-4" onClick={submitSuspension}>
                  Apply Suspension
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MechanicManagement;
