import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import AdminNav from '../../components/admin/AdminNav';
import { useAdminChat, subscribeToRequestMessages } from '../../hooks/useAdminChat';
import { getAdminSession } from '../../services/adminAuthService';
import '../../styles/adminDashboard.css';

const ChatMonitoring = () => {
  const { chats = [], loading, flagMessage, deleteMessage } = useAdminChat();
  const adminSession = getAdminSession() || { uid: '' };

  // Component States
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFlagged, setFilterFlagged] = useState('all');

  // Moderation Dialog states
  const [showModModal, setShowModModal] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [modReason, setModReason] = useState('Spam pattern');

  const threadEndRef = useRef(null);

  // Subscribe to messages when selected chat changes
  useEffect(() => {
    if (!selectedChat || !selectedChat.id) return;

    let isSubscribed = true;
    const unsubscribe = subscribeToRequestMessages(selectedChat.id, (list) => {
      if (isSubscribed) {
        setMessages(list || []);
      }
    });

    return () => {
      isSubscribed = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [selectedChat]);

  // Scroll to bottom of thread
  useEffect(() => {
    if (threadEndRef.current) {
      threadEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Filter list
  const filteredChats = (chats || []).filter(chat => {
    if (!chat) return false;
    const custMatch = (chat.customerName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const mechMatch = (chat.mechanicName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = (chat.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = custMatch || mechMatch || idMatch;

    let matchesFlagged = true;
    const isFlagged = (chat.flaggedMessages || []).length > 0;
    if (filterFlagged === 'flagged') matchesFlagged = isFlagged;
    else if (filterFlagged === 'clean') matchesFlagged = !isFlagged;

    return matchesSearch && matchesFlagged;
  });

  const openModDialog = (msg) => {
    setSelectedMsg(msg);
    setModReason('Spam pattern');
    setShowModModal(true);
  };

  const handleApplyFlag = async () => {
    if (!selectedChat || !selectedChat.id || !selectedMsg || !selectedMsg.id) return;
    try {
      await flagMessage(selectedChat.id, selectedMsg.id, modReason, adminSession.uid);
      setShowModModal(false);
      alert('Message flagged successfully for administrative audit.');
    } catch (e) {
      console.error('[ChatModeration] Error flagging message:', e);
      alert('Failed to apply moderation flag.');
    }
  };

  const handleApplyDelete = async () => {
    if (!selectedChat || !selectedChat.id || !selectedMsg || !selectedMsg.id) return;
    if (window.confirm('Replace this message with a moderation notice?')) {
      try {
        await deleteMessage(selectedChat.id, selectedMsg.id, adminSession.uid);
        setShowModModal(false);
      } catch (e) {
        console.error('[ChatModeration] Error deleting message:', e);
        alert('Failed to remove message.');
      }
    }
  };

  return (
    <div className="admin-theme min-vh-100 pb-5" style={{ backgroundColor: '#0F1419' }}>
      <AdminNav />

      <div className="container-fluid px-4 py-4">
        
        {/* Header */}
        <div className="mb-4">
          <span className="text-uppercase text-muted fw-bold" style={{ fontSize: '10px', letterSpacing: '1px' }}>
            Moderation Center
          </span>
          <h2 className="fw-black font-outfit text-white mb-0 admin-title-gradient">Chat Monitoring</h2>
        </div>

        {/* Console layout */}
        <div className="row g-4">
          
          {/* Left panel: chats directory */}
          <div className="col-12 col-lg-5">
            <div className="admin-glass-card p-3 d-flex flex-column" style={{ height: '620px' }}>
              <h5 className="fw-bold font-outfit text-white mb-3">Ongoing Conversations</h5>

              {/* Sidebar Filters */}
              <div className="row g-2 mb-3">
                <div className="col-8">
                  <input 
                    type="text" 
                    className="form-control admin-input w-100 border-0" 
                    placeholder="Search by name, request ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-4">
                  <select 
                    className="form-select admin-input border-0"
                    value={filterFlagged}
                    onChange={(e) => setFilterFlagged(e.target.value)}
                  >
                    <option value="all">All Chats</option>
                    <option value="flagged">Flagged</option>
                    <option value="clean">Clean</option>
                  </select>
                </div>
              </div>

              {/* Scrollable list */}
              <div className="overflow-auto flex-grow-1 d-flex flex-column gap-2 pe-1">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-warning" role="status"></div>
                  </div>
                ) : filteredChats.length === 0 ? (
                  <p className="text-center text-muted py-5 small">No conversations logged in Firestore databases.</p>
                ) : (
                  filteredChats.map((chat) => {
                    const isSelected = selectedChat?.id === chat.id;
                    const flaggedCount = (chat.flaggedMessages || []).length;
                    const dateStr = chat.lastMessageTime?.seconds 
                      ? new Date(chat.lastMessageTime.seconds * 1000).toLocaleTimeString() 
                      : 'Active';

                    return (
                      <div 
                        key={chat.id}
                        onClick={() => setSelectedChat(chat)}
                        className={`p-3 rounded-3 cursor-pointer d-flex justify-content-between align-items-start border transition-all`}
                        style={{ 
                          backgroundColor: isSelected ? 'rgba(255, 107, 53, 0.08)' : 'rgba(26, 31, 46, 0.4)',
                          borderColor: isSelected ? 'var(--admin-primary)' : flaggedCount > 0 ? 'rgba(244, 67, 54, 0.3)' : 'rgba(255,255,255,0.04)',
                          cursor: 'pointer'
                        }}
                      >
                        <div className="flex-grow-1 text-truncate me-2">
                          <strong className="text-white d-block small mb-0.5">{chat.customerName || 'Driver'} ↔ {chat.mechanicName || 'Partner'}</strong>
                          <span className="text-white-50 d-block small text-truncate" style={{ fontSize: '12px' }}>
                            {chat.lastMessageText || 'Chat initialized'}
                          </span>
                          <span className="text-muted d-block font-monospace mt-1" style={{ fontSize: '9px' }}>Case ID: {(chat.id || '').slice(0, 8).toUpperCase()}</span>
                        </div>
                        <div className="text-end flex-shrink-0">
                          <span className="text-muted small d-block font-mono" style={{ fontSize: '10px' }}>{dateStr}</span>
                          {flaggedCount > 0 && (
                            <span className="badge bg-danger text-white rounded-pill mt-1.5 fw-bold" style={{ fontSize: '9px' }}>
                              {flaggedCount} Flags
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right panel: message thread details */}
          <div className="col-12 col-lg-7">
            <div className="admin-glass-card p-0 overflow-hidden d-flex flex-column justify-content-between" style={{ height: '620px' }}>
              {selectedChat ? (
                <>
                  {/* Header info */}
                  <div className="p-3 border-bottom border-secondary border-opacity-10 d-flex justify-content-between align-items-center bg-dark bg-opacity-15">
                    <div>
                      <h6 className="fw-bold text-white mb-0">{selectedChat.customerName || 'Driver'} ↔ {selectedChat.mechanicName || 'Partner'}</h6>
                      <small className="text-muted font-monospace" style={{ fontSize: '11px' }}>Request UID: {selectedChat.id}</small>
                    </div>
                    <div className="d-flex gap-2">
                      {selectedChat.customerId && (
                        <Link to={`/admin/customers/${selectedChat.customerId}`} className="btn btn-outline-info btn-xs py-1 px-2.5" style={{ fontSize: '11px', borderRadius: '5px' }}>
                          Driver Info
                        </Link>
                      )}
                      {selectedChat.mechanicId && (
                        <Link to={`/admin/mechanics/${selectedChat.mechanicId}`} className="btn btn-outline-warning btn-xs py-1 px-2.5" style={{ fontSize: '11px', borderRadius: '5px' }}>
                          Partner Info
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Message scroll log */}
                  <div className="flex-grow-1 overflow-auto p-3 d-flex flex-column gap-3 bg-dark bg-opacity-10">
                    {messages.length === 0 ? (
                      <p className="text-center text-muted my-auto small">Establishing connection... No messages sent in chat thread yet.</p>
                    ) : (
                      messages.map((msg) => {
                        if (!msg) return null;
                        const isSystem = msg.senderRole === 'system';
                        const isDriver = msg.senderRole === 'customer' || msg.senderRole === 'user';
                        const isMech = msg.senderRole === 'mechanic';

                        let align = 'justify-content-center';
                        let bgColor = 'rgba(255,255,255,0.05)';
                        let textColor = 'text-white-50';
                        let label = 'System Alert';

                        if (isDriver) {
                          align = 'justify-content-start';
                          bgColor = 'rgba(76, 175, 80, 0.12)';
                          textColor = 'text-white';
                          label = 'Driver Client';
                        } else if (isMech) {
                          align = 'justify-content-end';
                          bgColor = 'rgba(33, 150, 243, 0.12)';
                          textColor = 'text-white';
                          label = 'Rescue Partner';
                        }

                        return (
                          <div key={msg.id} className={`d-flex ${align}`}>
                            <div className="rounded-3 p-3 border border-secondary border-opacity-10" style={{ maxWidth: '75%', backgroundColor: bgColor }}>
                              <div className="d-flex justify-content-between align-items-center gap-4 border-bottom border-secondary border-opacity-10 pb-1 mb-1.5">
                                <span className={`fw-bold small ${isDriver ? 'text-success' : isMech ? 'text-info' : 'text-muted'}`} style={{ fontSize: '11px' }}>
                                  {label} ({msg.senderName || 'User'})
                                </span>
                                <span className="text-muted small font-mono" style={{ fontSize: '9px' }}>
                                  {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString() : ''}
                                </span>
                              </div>
                              <p className={`mb-0 small ${textColor} ${msg.isModerated ? 'italic text-danger' : ''}`}>{msg.text || ''}</p>
                              
                              {/* Moderation links */}
                              {!isSystem && !msg.isModerated && (
                                <div className="d-flex gap-2 justify-content-end mt-2.5 pt-1.5 border-top border-secondary border-opacity-10">
                                  <button className="btn btn-link text-warning p-0 small text-decoration-none" onClick={() => openModDialog(msg)} style={{ fontSize: '10px' }}>
                                    <i className="fas fa-flag me-1"></i> Flag
                                  </button>
                                  <button className="btn btn-link text-danger p-0 small text-decoration-none" onClick={() => openModDialog(msg)} style={{ fontSize: '10px' }}>
                                    <i className="fas fa-trash me-1"></i> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={threadEndRef} />
                  </div>
                </>
              ) : (
                <div className="my-auto text-center text-muted py-5">
                  <i className="fas fa-comments fs-1 mb-3"></i>
                  <p className="mb-0">Select an active conversation thread from the left directory pane to moderate.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Moderation Warning/Deletion Dialog Modal */}
      {showModModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content admin-glass-card border-danger border-opacity-30">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-white">Moderate Message Entry</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModModal(false)}></button>
              </div>
              <div className="modal-body py-3 text-white-50 small">
                <div className="bg-dark bg-opacity-30 rounded-3 p-3 mb-3 border border-secondary border-opacity-10">
                  <strong className="text-white">Selected Message Content:</strong>
                  <p className="mb-0 mt-1 italic">"{selectedMsg?.text || ''}"</p>
                </div>

                <div className="mb-3">
                  <label className="form-label text-white-50 small mb-1">Reason for Action</label>
                  <select 
                    className="form-select admin-input border-0"
                    value={modReason}
                    onChange={(e) => setModReason(e.target.value)}
                  >
                    <option value="Spam pattern">Spam / Excessive messaging</option>
                    <option value="Abusive language">Abusive or disrespectful language</option>
                    <option value="Inappropriate content">Inappropriate / Off-topic content</option>
                    <option value="Security risk">Sharing private data / credentials</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0 justify-content-between">
                <button type="button" className="btn admin-btn-secondary" onClick={() => setShowModModal(false)}>Cancel</button>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-warning text-dark fw-bold" onClick={handleApplyFlag}>
                    Apply Flag
                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleApplyDelete}>
                    Moderate & Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChatMonitoring;
