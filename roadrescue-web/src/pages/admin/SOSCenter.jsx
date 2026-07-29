import React, { useState, useEffect } from 'react';
import AdminNav from '../../components/admin/AdminNav';
import { useAdminSOS } from '../../hooks/useAdminSOS';
import { getAdminSession } from '../../services/adminAuthService';
import '../../styles/adminDashboard.css';

// Elapsed timer helper sub-component
const ElapsedTimer = ({ createdAt }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!createdAt) return;
    
    // Defensive parsing for Firestore Timestamp, standard Date, or ISO strings
    const createdAtMs = createdAt.seconds 
      ? createdAt.seconds * 1000 
      : (createdAt.toDate 
          ? createdAt.toDate().getTime() 
          : (createdAt instanceof Date ? createdAt.getTime() : new Date(createdAt).getTime()));

    const updateTimer = () => {
      const diff = Math.floor((Date.now() - createdAtMs) / 1000);
      setSeconds(diff > 0 ? diff : 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <span className="fw-mono text-danger fw-bold fs-5">
      {formatTime(seconds)}
    </span>
  );
};

const SOSCenter = () => {
  const { 
    activeSOSList, 
    onlineMechanics, 
    loading, 
    manualDispatch, 
    escalateEmergency, 
    manuallyResolveSOS 
  } = useAdminSOS();

  const adminSession = getAdminSession() || { uid: '' };

  // UI States
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [selectedSOS, setSelectedSOS] = useState(null);
  
  // Modal states
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveReason, setResolveReason] = useState('Mechanic arrived on scene');

  // Trigger sound alarm if there are active unassigned SOS requests and sound is enabled
  useEffect(() => {
    if (!soundEnabled || activeSOSList.length === 0) return;
    
    const unassignedSOS = activeSOSList.filter(sos => !sos.mechanicId && !sos.assignedMechanicId);
    if (unassignedSOS.length === 0) return;

    // Create custom oscillator audio alert
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const playBeep = () => {
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioContext.currentTime); // Pitch (A5)
      gain.gain.setValueAtTime(0.08, audioContext.currentTime); // Soft volume

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.start();
      osc.stop(audioContext.currentTime + 0.15); // Beep duration
    };

    const interval = setInterval(playBeep, 2000);
    return () => {
      clearInterval(interval);
      audioContext.close();
    };
  }, [soundEnabled, activeSOSList]);

  const openDispatch = (sos) => {
    setSelectedSOS(sos);
    setShowDispatchModal(true);
  };

  const handleDispatchSelect = async (mechanicId) => {
    if (window.confirm('Dispatch this mechanic partner to the emergency?')) {
      await manualDispatch(selectedSOS.id, mechanicId, adminSession.uid);
      setShowDispatchModal(false);
    }
  };

  const openEscalate = (sos) => {
    setSelectedSOS(sos);
    setShowEscalateModal(true);
  };

  const handleEscalateSelect = async (type) => {
    await escalateEmergency(selectedSOS.id, type, adminSession.uid);
    setShowEscalateModal(false);
    alert(`Emergency escalated to the ${type.toUpperCase()} authorities.`);
  };

  const openResolve = (sos) => {
    setSelectedSOS(sos);
    setResolveReason('Mechanic arrived on scene');
    setShowResolveModal(true);
  };

  const handleResolveSubmit = async () => {
    await manuallyResolveSOS(selectedSOS.id, resolveReason, adminSession.uid);
    setShowResolveModal(false);
  };

  return (
    <div className="admin-theme min-vh-100 pb-5" style={{ backgroundColor: '#0F1419' }}>
      <AdminNav />

      <div className="container-fluid px-4 py-4">
        
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <span className="text-uppercase text-muted fw-bold" style={{ fontSize: '10px', letterSpacing: '1px' }}>
              Priority Dispatch
            </span>
            <h2 className="fw-black font-outfit text-white mb-0 admin-title-gradient">Emergency SOS Control Center</h2>
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* Audio Alert Toggle */}
            <button 
              className={`btn ${soundEnabled ? 'btn-danger' : 'btn-outline-secondary'} py-2 px-3 small d-flex align-items-center gap-1.5`}
              onClick={() => setSoundEnabled(!soundEnabled)}
              style={{ borderRadius: '8px' }}
            >
              <i className={`fas ${soundEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
              <span>{soundEnabled ? 'Audio Alarms On' : 'Mute Alarms'}</span>
            </button>
          </div>
        </div>

        {/* SOS Flashing KPI banner */}
        <div className="row g-4 mb-4">
          <div className="col-12">
            <div className={`admin-glass-card p-4 text-center ${activeSOSList.length > 0 ? 'admin-pulse-emergency' : ''}`}>
              <h5 className="text-white-50 text-uppercase fw-bold small mb-2">Active Emergencies Queue</h5>
              <h1 className={`fw-black text-white font-outfit mb-0 ${activeSOSList.length > 0 ? 'admin-flash-text' : ''}`} style={{ fontSize: '3.5rem' }}>
                {activeSOSList.length}
              </h1>
              {activeSOSList.length > 0 ? (
                <small className="text-danger fw-bold d-block mt-2 font-outfit">
                  <span className="spinner-grow spinner-grow-sm text-danger me-1.5 align-middle"></span>
                  IMMEDIATE ACTION OR DISPATCH OVERRIDE REQUIRED
                </small>
              ) : (
                <small className="text-success fw-bold d-block mt-2 font-outfit">
                  <i className="fas fa-circle-check me-1.5"></i> All roadside operations are fully clear and stable.
                </small>
              )}
            </div>
          </div>
        </div>

        {/* SOS Emergencies List Grid */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status"></div>
          </div>
        ) : (
          <div className="row g-4">
            {activeSOSList.length === 0 ? (
              <div className="col-12">
                <div className="admin-glass-card py-5 text-center text-muted">
                  <i className="fas fa-circle-check text-success fs-2 mb-3"></i>
                  <p className="mb-0">No active SOS alarms in Firestore databases. Dispatch logs are perfectly stable.</p>
                </div>
              </div>
            ) : (
              activeSOSList.map((sos) => {
                const isAssigned = !!(sos.mechanicId || sos.assignedMechanicId);
                const hasArrived = sos.status === 'arrived' || sos.status === 'repairing';
                
                return (
                  <div key={sos.id} className="col-12 col-md-6 col-lg-4">
                    <div className={`admin-glass-card p-4 h-100 border-opacity-40 d-flex flex-column justify-content-between ${!isAssigned ? 'border-danger' : hasArrived ? 'border-success' : 'border-warning'}`}>
                      <div>
                        {/* Header card details */}
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <span className="badge bg-danger bg-opacity-15 text-danger border border-danger border-opacity-25 admin-badge mb-1">SOS</span>
                            <h5 className="fw-bold text-white mb-0">{sos.customerName || 'RoadRescue Customer'}</h5>
                          </div>
                          <ElapsedTimer createdAt={sos.createdAt} />
                        </div>

                        {/* Location / details */}
                        <div className="text-white-50 small mb-3">
                          <span className="d-block mb-1.5"><i className="fas fa-phone text-warning me-2"></i> {sos.customerPhone || 'No contact phone'}</span>
                          <span className="d-block mb-1.5"><i className="fas fa-map-pin text-warning me-2"></i> {sos.pickupAddress || 'No pickup coordinates'}</span>
                          <span className="d-block italic"><i className="fas fa-triangle-exclamation text-warning me-2"></i> Issue: {sos.issueType?.replace('_', ' ').toUpperCase() || 'EMERGENCY HELP'}</span>
                          {sos.description && <p className="mt-2 bg-dark bg-opacity-30 p-2 rounded text-light small border border-secondary border-opacity-10 mb-0">"{sos.description}"</p>}
                        </div>

                        {/* Dispatch tracking status */}
                        <div className="border-top border-secondary border-opacity-10 pt-2.5 text-white-50 small mb-3">
                          <span className="fw-bold text-white d-block mb-1">Response Partner Allocations</span>
                          {isAssigned ? (
                            <div className="bg-dark bg-opacity-25 rounded-3 p-2.5 border border-secondary border-opacity-10 mt-1.5">
                              <strong className="d-block text-white mb-0.5">{sos.mechanicName}</strong>
                              <span className="d-block text-white-50"><i className="fas fa-phone me-1.5 text-warning"></i> {sos.mechanicPhone || 'No phone'}</span>
                              <span className="badge bg-warning text-dark mt-2.5 font-outfit text-uppercase" style={{ fontSize: '9px', fontWeight: '800' }}>
                                STATUS: {sos.status?.replace('_', ' ')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-danger small font-bold"><i className="fas fa-circle-exclamation me-1.5"></i> UNASSIGNED FOR EMERGENCY OVERRIDE</span>
                          )}

                          {/* Escalation states */}
                          {sos.escalationStatus && (
                            <div className="badge bg-danger text-white w-100 mt-2.5 py-1.5 text-uppercase fw-bold border border-danger border-opacity-30">
                              <i className="fas fa-shield-halved me-1.5"></i> ESCALATED TO: {sos.escalationStatus}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Toolbars */}
                      <div className="border-top border-secondary border-opacity-10 pt-3 d-flex flex-wrap gap-1">
                        {!isAssigned && (
                          <button 
                            className="btn admin-btn-primary btn-sm flex-grow-1"
                            onClick={() => openDispatch(sos)}
                          >
                            <i className="fas fa-truck-monster me-1.5"></i> Manual Dispatch
                          </button>
                        )}
                        <button 
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => openEscalate(sos)}
                          disabled={!!sos.escalationStatus}
                        >
                          <i className="fas fa-shield-halved"></i> Escalate
                        </button>
                        <button 
                          className="btn btn-outline-success btn-sm flex-grow-1"
                          onClick={() => openResolve(sos)}
                        >
                          <i className="fas fa-check"></i> Resolve SOS
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>

      {/* Manual Dispatch override dialog */}
      {showDispatchModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content admin-glass-card border-warning border-opacity-30">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-white">Manual Rescue Partner Allocations</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDispatchModal(false)}></button>
              </div>
              <div className="modal-body py-3">
                <span className="text-white-50 d-block small mb-3">
                  Allocating a partner will override the auto-scheduler. The selected partner will instantly receive a red-flashing push alert.
                </span>

                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Partner Name</th>
                        <th>Specialty</th>
                        <th>Rating</th>
                        <th>Distance / Status</th>
                        <th className="text-end">Assign</th>
                      </tr>
                    </thead>
                    <tbody>
                      {onlineMechanics.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-4 text-muted">No online, available mechanics found.</td>
                        </tr>
                      ) : (
                        onlineMechanics.map((mech) => (
                          <tr key={mech.id}>
                            <td className="fw-bold text-white">{mech.name}</td>
                            <td className="text-white-50">{mech.specialty?.replace('_', ' ').toUpperCase() || 'GENERAL'}</td>
                            <td className="text-warning fw-bold">★ {mech.rating || '5.0'}</td>
                            <td>
                              <span className="admin-badge admin-badge-success">Online & Available</span>
                            </td>
                            <td className="text-end">
                              <button 
                                className="btn admin-btn-primary btn-sm px-3 py-1"
                                onClick={() => handleDispatchSelect(mech.id)}
                              >
                                Dispatch
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn admin-btn-secondary" onClick={() => setShowDispatchModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Escalation options dialog */}
      {showEscalateModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content admin-glass-card border-danger border-opacity-30">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-white">Escalate Emergency Event</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEscalateModal(false)}></button>
              </div>
              <div className="modal-body py-3">
                <span className="text-white-50 d-block small mb-3">
                  Select the appropriate authority to escalate. This logs the time of dispatch and notifies response agents.
                </span>

                <div className="d-grid gap-2">
                  <button className="btn btn-outline-danger text-start py-2.5 px-3 d-flex justify-content-between align-items-center" onClick={() => handleEscalateSelect('police')}>
                    <span><i className="fas fa-building-shield me-2.5"></i> Escalate to Police Force</span>
                    <i className="fas fa-chevron-right text-muted"></i>
                  </button>
                  <button className="btn btn-outline-warning text-start py-2.5 px-3 d-flex justify-content-between align-items-center" onClick={() => handleEscalateSelect('fire')}>
                    <span><i className="fas fa-fire-extinguisher me-2.5"></i> Escalate to Fire Department</span>
                    <i className="fas fa-chevron-right text-muted"></i>
                  </button>
                  <button className="btn btn-outline-info text-start py-2.5 px-3 d-flex justify-content-between align-items-center" onClick={() => handleEscalateSelect('ambulance')}>
                    <span><i className="fas fa-truck-medical me-2.5"></i> Escalate to Ambulance / Medical</span>
                    <i className="fas fa-chevron-right text-muted"></i>
                  </button>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn admin-btn-secondary w-100" onClick={() => setShowEscalateModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Resolution Dialog Modal */}
      {showResolveModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content admin-glass-card border-success border-opacity-30">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-white">Manually Resolve Emergency</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowResolveModal(false)}></button>
              </div>
              <div className="modal-body py-3">
                <label className="form-label text-white-50 small mb-1">Resolution Summary Note (required)</label>
                <textarea 
                  className="form-control admin-input border-0" 
                  rows="3"
                  placeholder="Summarise event resolution (e.g. Driver safely verified, private towing arranged)"
                  value={resolveReason}
                  onChange={(e) => setResolveReason(e.target.value)}
                  required
                />
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn admin-btn-secondary" onClick={() => setShowResolveModal(false)}>Cancel</button>
                <button 
                  type="button" 
                  className="btn btn-success px-4" 
                  onClick={handleResolveSubmit}
                  disabled={!resolveReason}
                >
                  Resolve SOS Alarm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SOSCenter;
