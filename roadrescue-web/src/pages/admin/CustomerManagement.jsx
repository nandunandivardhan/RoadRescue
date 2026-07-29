import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminNav from '../../components/admin/AdminNav';
import { useAdminCustomers } from '../../hooks/useAdminCustomers';
import { getAdminSession } from '../../services/adminAuthService';
import '../../styles/adminDashboard.css';

const CustomerManagement = () => {
  const { 
    customers, 
    loading, 
    disableCustomer, 
    enableCustomer, 
    warnCustomer 
  } = useAdminCustomers();

  const adminSession = getAdminSession() || { uid: '' };

  // Local States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [warningFilter, setWarningFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Dialog Modals
  const [showWarnDialog, setShowWarnDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [selectedCustId, setSelectedCustId] = useState(null);
  const [warnReason, setWarnReason] = useState('Disrespectful behavior');
  const [warnMessage, setWarnMessage] = useState('');
  const [disableReason, setDisableReason] = useState('Abusive behavior');

  // Filter
  const filteredCustomers = customers.filter(cust => {
    const nameMatch = cust.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const phoneMatch = (cust.phone || '').includes(searchTerm);
    const emailMatch = (cust.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = nameMatch || phoneMatch || emailMatch;

    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = cust.accountStatus === 'active' || !cust.accountStatus;
    else if (statusFilter === 'suspended') matchesStatus = cust.accountStatus === 'disabled';

    let matchesWarning = true;
    if (warningFilter === 'flagged') matchesWarning = (cust.warnings || []).length > 0;
    else if (warningFilter === 'critical') matchesWarning = (cust.warnings || []).length >= 2;

    return matchesSearch && matchesStatus && matchesWarning;
  });

  // Sort
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortBy === 'name') {
      return a.fullName.localeCompare(b.fullName);
    } else if (sortBy === 'warnings') {
      return (b.warnings || []).length - (a.warnings || []).length;
    }
    return 0;
  });

  // Paginate
  const totalItems = sortedCustomers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = sortedCustomers.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleEnable = async (id) => {
    if (window.confirm('Re-enable this customer account?')) {
      await enableCustomer(id, adminSession.uid);
    }
  };

  const openWarnDialog = (id) => {
    setSelectedCustId(id);
    setWarnReason('Disrespectful behavior');
    setWarnMessage('');
    setShowWarnDialog(true);
  };

  const submitWarning = async () => {
    await warnCustomer(selectedCustId, warnReason, warnMessage, adminSession.uid);
    setShowWarnDialog(false);
  };

  const openDisableDialog = (id) => {
    setSelectedCustId(id);
    setDisableReason('Abusive behavior');
    setShowDisableDialog(true);
  };

  const submitDisable = async () => {
    await disableCustomer(selectedCustId, disableReason, adminSession.uid);
    setShowDisableDialog(false);
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
          <h2 className="fw-black font-outfit text-white mb-0 admin-title-gradient">Customer Accounts</h2>
        </div>

        {/* Filters */}
        <div className="admin-glass-card p-3 mb-4">
          <div className="row g-3">
            
            {/* Search */}
            <div className="col-12 col-md-5">
              <label className="small text-white-50 mb-1 fw-medium">Search Drivers</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-0 text-white-50"><i className="fas fa-search"></i></span>
                <input 
                  type="text" 
                  className="form-control admin-input border-0" 
                  placeholder="Search by name, phone, email..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>

            {/* Filter Status */}
            <div className="col-6 col-md-2">
              <label className="small text-white-50 mb-1 fw-medium">Account Status</label>
              <select 
                className="form-select admin-input border-0"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Disabled</option>
              </select>
            </div>

            {/* Filter Warnings */}
            <div className="col-6 col-md-2">
              <label className="small text-white-50 mb-1 fw-medium">Strikes Filter</label>
              <select 
                className="form-select admin-input border-0"
                value={warningFilter}
                onChange={(e) => { setWarningFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">Any Warnings</option>
                <option value="flagged">1+ Warnings</option>
                <option value="critical">Critical (2+ Warnings)</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="col-12 col-md-3">
              <label className="small text-white-50 mb-1 fw-medium">Sort By</label>
              <select 
                className="form-select admin-input border-0"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Name</option>
                <option value="warnings">Warnings Count</option>
              </select>
            </div>

          </div>
        </div>

        {/* Customer list table */}
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
                    <th>Driver Name</th>
                    <th>Email Address</th>
                    <th>Phone Contact</th>
                    <th>Warning Strikes</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCustomers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-5 text-muted">No customer profiles found.</td>
                    </tr>
                  ) : (
                    currentCustomers.map((cust) => {
                      const strikeCount = (cust.warnings || []).length;
                      return (
                        <tr key={cust.id}>
                          <td>
                            <span className="fw-bold text-white">
                              <Link to={`/admin/customers/${cust.id}`} className="text-white text-decoration-none hover-orange">
                                {cust.fullName}
                              </Link>
                            </span>
                            <span className="text-muted d-block" style={{ fontSize: '10px', fontFamily: 'monospace' }}>ID: {cust.id.slice(0, 8)}...</span>
                          </td>
                          <td className="text-white-50">{cust.email}</td>
                          <td className="text-white-50">{cust.phone || 'No phone registered'}</td>
                          <td>
                            <div className="d-flex align-items-center gap-1.5">
                              <span className={`admin-badge ${strikeCount === 0 ? 'admin-badge-success' : strikeCount === 1 ? 'admin-badge-warning' : 'admin-badge-danger'}`}>
                                {strikeCount} Strikes
                              </span>
                              {strikeCount > 0 && (
                                <span className="small text-danger" style={{ fontSize: '11px' }}>
                                  {Array(strikeCount).fill('★').join('')}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            {cust.accountStatus === 'disabled' ? (
                              <span className="admin-badge admin-badge-danger">DISABLED</span>
                            ) : (
                              <span className="admin-badge admin-badge-success">ACTIVE</span>
                            )}
                          </td>
                          <td className="text-end">
                            <div className="d-flex justify-content-end gap-1">
                              <Link to={`/admin/customers/${cust.id}`} className="btn btn-outline-info btn-xs py-1 px-2.5" style={{ fontSize: '11px', borderRadius: '5px' }}>
                                Inspect
                              </Link>
                              
                              <button 
                                className="btn btn-outline-warning btn-xs py-1 px-2.5" 
                                onClick={() => openWarnDialog(cust.id)} 
                                style={{ fontSize: '11px', borderRadius: '5px' }}
                              >
                                Issue Strike
                              </button>

                              {cust.accountStatus === 'disabled' ? (
                                <button className="btn btn-success btn-xs py-1 px-2.5" onClick={() => handleEnable(cust.id)} style={{ fontSize: '11px', borderRadius: '5px' }}>
                                  Enable
                                </button>
                              ) : (
                                <button className="btn btn-danger btn-xs py-1 px-2.5" onClick={() => openDisableDialog(cust.id)} style={{ fontSize: '11px', borderRadius: '5px' }}>
                                  Disable
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
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

      {/* Warning Dialog Modal */}
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

      {/* Disable Account Dialog Modal */}
      {showDisableDialog && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content admin-glass-card border-danger border-opacity-30">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-white">Disable Customer Account</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDisableDialog(false)}></button>
              </div>
              <div className="modal-body py-3">
                <label className="form-label text-white-50 small mb-1">Reason for Action</label>
                <select 
                  className="form-select admin-input border-0"
                  value={disableReason}
                  onChange={(e) => setDisableReason(e.target.value)}
                >
                  <option value="Abusive behavior">Abusive behavior</option>
                  <option value="Fraudulent activity">Fraudulent activity</option>
                  <option value="Policy violation">Policy violation</option>
                  <option value="Strikes exceeded">Warning strikes exceeded</option>
                </select>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn admin-btn-secondary" onClick={() => setShowDisableDialog(false)}>Cancel</button>
                <button type="button" className="btn btn-danger px-4" onClick={submitDisable}>
                  Disable Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerManagement;
