import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RoadRescueMap from '../components/MapContainer';
import { 
  acceptRequest, 
  updateRequestStatus,
  updateMechanicStatus,
  subscribeToActiveRequest,
  subscribeToNearbyRequests,
  getRequestHistory,
  sendMessage,
  subscribeToMessages,
  updateUserProfilePhone
} from '../services/api';
import { doc, setDoc, serverTimestamp, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

const SERVICES = [
  { id: 'flat_tire', label: 'Tire Repair', icon: 'fa-solid fa-tire', color: '#FF6B35' },
  { id: 'battery', label: 'Battery Jump', icon: 'fa-solid fa-car-battery', color: '#2979FF' },
  { id: 'engine', label: 'Engine Help', icon: 'fa-solid fa-gauge-high', color: '#FF1744' },
  { id: 'fuel', label: 'Fuel Delivery', icon: 'fa-solid fa-gas-pump', color: '#FFB300' },
  { id: 'towing', label: 'Towing', icon: 'fa-solid fa-truck-pickup', color: '#00C853' },
  { id: 'other', label: 'General Fix', icon: 'fa-solid fa-wrench', color: '#6B7280' },
];

const MechanicDashboard = () => {
  const { user, logoutUser, updatePhoneInSession, updateRoleInSession } = useAuth();
  const navigate = useNavigate();
  
  // Hydration-First Auth Flow States (Requirement 1 & 3)
  const savedApproved = localStorage.getItem('rr_mechanic_approved') === 'true';
  const [authLoading, setAuthLoading] = useState(!user);
  const [mechanicLoading, setMechanicLoading] = useState(!savedApproved);
  const [hydrationComplete, setHydrationComplete] = useState(savedApproved);
  
  // Dashboard Statuses
  const [isOnline, setIsOnline] = useState(true);
  const [activeJob, setActiveJob] = useState(null);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [mechanicVerified, setMechanicVerified] = useState(false);

  // Profile management states (FINAL ISSUE 2 FIXED)
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profilePhone, setProfilePhone] = useState(user.phone || '');
  const [profileAvatar, setProfileAvatar] = useState(user.avatarUrl || user.avatar || '');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  
  // Realtime synced customer phone state (FINAL ISSUE 2 FIXED)
  const [customerLatestPhone, setCustomerLatestPhone] = useState('');

  // Workflow state matching APK navigation ('homepage' vs 'active_job')
  const [viewState, setViewState] = useState('homepage');

  // Dynamic Stats
  const [stats, setStats] = useState({
    rating: 0.0,
    totalReviews: 0,
    jobsCompleted: 0,
    earnings: 0
  });

  // Mechanic Profile Details
  const [specialty, setSpecialty] = useState('flat_tire');
  const [experienceYears, setExperienceYears] = useState(5);
  const [infoModalContent, setInfoModalContent] = useState(null);

  // Past Completed Log list
  const [mechanicHistory, setMechanicHistory] = useState([]);

  // Precise Browser Coordinates
  const [myLocation, setMyLocation] = useState({ latitude: 28.4595, longitude: 77.0266 });

  // SOS Emergency Popup Modal states
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [currentEmergencyRequest, setCurrentEmergencyRequest] = useState(null);

  // Live Chat System states (FINAL ISSUE 2 FIXED!)
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatBottomRef = useRef(null);

  // 1. Diagnostic Logging for Hydration Status (Requirement 7)
  useEffect(() => {
    console.log('[MechanicAuth] State Audit:', {
      authInitialized: !authLoading,
      mechanicDocLoaded: !mechanicLoading,
      approvalStateResolved: savedApproved,
      hydrationComplete: hydrationComplete
    });
  }, [authLoading, mechanicLoading, hydrationComplete]);

  // Handle Hydration completion (Requirement 1)
  useEffect(() => {
    if (!authLoading && !mechanicLoading) {
      setHydrationComplete(true);
      console.log('[MechanicAuth] Hydration Complete - authLoading: false, mechanicLoading: false');
    }
  }, [authLoading, mechanicLoading]);

  // Geolocation, Profile and Auth Status Listener on mount (Requirement 1, 2, 3, 5, 6, 7)
  useEffect(() => {
    // 4. MECHANIC VALIDATION
    if (!user || user.role?.toLowerCase() !== 'mechanic') {
      console.log('[MechanicAuth] Access denied: User is not a mechanic');
      navigate('/dashboard');
      return;
    }
    
    console.log('[MechanicAuth] Registering Firestore status listener for UID:', user.id);
    
    // Realtime approval and suspension check from mechanics collection
    const unsubStatus = onSnapshot(doc(db, 'mechanics', user.id), (docSnap) => {
      console.log('[MechanicAuth] onSnapshot received. exists:', docSnap.exists());
      
      setAuthLoading(false);
      
      if (!docSnap.exists()) {
        console.warn('[MechanicAuth] Mechanic document does not exist yet. Silent retry, preserving session.');
        setMechanicLoading(false);
        return;
      }
      
      const mData = docSnap.data();
      const status = mData.status;
      const approved = mData.approved;
      const isApprovedField = mData.isApproved;
      
      setSpecialty(mData.specialty || 'flat_tire');
      setExperienceYears(mData.experienceYears || 5);
      setMechanicVerified(mData.verified === true);

      // Support ALL valid approval structures: approved === true, isApproved === true, status === "approved", status === "active" (Requirement 5)
      const isApproved = approved === true || isApprovedField === true || status === 'active' || status === 'approved';
      
      // ONLY deny access if explicitly: approved === false, isApproved === false, status === "rejected", status === "suspended" (Requirement 2)
      const isSuspended = mData.suspended === true || status === 'suspended';
      const isRejected = approved === false || isApprovedField === false || status === 'rejected';

      console.log('[MechanicAuth] Resolved States:', {
        status,
        approved,
        isApprovedField,
        isApproved,
        isSuspended,
        isRejected
      });

      // Persist verified mechanic approval session state (Requirement 3)
      if (isApproved) {
        localStorage.setItem('rr_mechanic_approved', 'true');
        localStorage.setItem('rr_mechanic_profile', JSON.stringify(mData));
      }

      setMechanicLoading(false);

      if (isSuspended) {
        console.log('[MechanicAuth] Suspension detected. Access Denied.');
        alert('Access Denied: Your mechanic account has been suspended by a RoadRescue administrator.');
        localStorage.removeItem('rr_mechanic_approved');
        localStorage.removeItem('rr_mechanic_profile');
        logoutUser();
        navigate('/login');
      } else if (isRejected) {
        console.log('[MechanicAuth] Rejection detected. Access Denied.');
        alert('Access Denied: Your mechanic credentials were rejected.');
        localStorage.removeItem('rr_mechanic_approved');
        localStorage.removeItem('rr_mechanic_profile');
        logoutUser();
        navigate('/login');
      } else if (approved === false || isApprovedField === false) {
        console.log('[MechanicAuth] Explicit unapproved/denied state detected. Access Denied.');
        alert('Access Denied: Your mechanic credentials are pending review or were rejected.');
        localStorage.removeItem('rr_mechanic_approved');
        localStorage.removeItem('rr_mechanic_profile');
        logoutUser();
        navigate('/login');
      }
    }, (err) => {
      // Do not auto-logout on temporary fetch failure (Requirement 6)
      console.error('[MechanicAuth] Temporary fetch failure on status listener. Silently retrying and preserving session. Error:', err);
      setAuthLoading(false);
      setMechanicLoading(false);
    });

    detectMyLocation();
    fetchMechanicStats();
    fetchLatestProfile();

    return () => unsubStatus();
  }, [user?.id, navigate]);

  const fetchLatestProfile = async () => {
    try {
      const uDoc = await getDoc(doc(db, 'users', user.id));
      if (uDoc.exists()) {
        const data = uDoc.data();
        setProfilePhone(data.phone || data.phoneNumber || '');
        setProfileAvatar(data.avatarUrl || data.avatar || '');
        setEmergencyContact(data.emergencyContact || '');
        
        const dbPhone = data.phone || data.phoneNumber || '';
        const dbAvatar = data.avatarUrl || data.avatar || '';
        if (dbPhone !== user.phone || dbAvatar !== user.avatarUrl) {
          updatePhoneInSession(dbPhone, dbAvatar);
        }
      }
    } catch (e) {
      console.error('Failed to load profile details:', e);
    }
  };

  // Realtime onSnapshot listener for customer phone updates (FINAL ISSUE 2 FIXED)
  useEffect(() => {
    if (activeJob?.customerId) {
      const unsub = onSnapshot(doc(db, 'users', activeJob.customerId), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCustomerLatestPhone(data.phone || data.phoneNumber || '');
        }
      });
      return () => unsub();
    } else {
      setCustomerLatestPhone('');
    }
  }, [activeJob?.customerId]);

  const handleProfileSave = async () => {
    if (!profilePhone.trim()) return;
    setProfileSaving(true);
    try {
      await updateUserProfilePhone(user.id, 'mechanic', profilePhone, emergencyContact);
      
      // Update custom avatar properties safely using merge: true setDoc
      await setDoc(doc(db, 'users', user.id), {
        avatar: profileAvatar,
        avatarUrl: profileAvatar,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Save specialty and experienceYears back to Firestore mechanics collection
      await updateDoc(doc(db, 'mechanics', user.id), {
        specialty,
        experienceYears: parseInt(experienceYears) || 5
      });

      updatePhoneInSession(profilePhone, profileAvatar);
      alert('Profile details updated successfully!');
      setShowProfileEdit(false);
    } catch (e) {
      console.error('Failed to update profile:', e);
      alert('Failed to update contact info: ' + e.message);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSwitchToCustomer = async () => {
    if (!window.confirm("Are you sure you want to switch to the CUSTOMER dashboard? This will update your profile role.")) return;
    try {
      await updateDoc(doc(db, 'users', user.id), { 
        role: 'customer',
        roles: ['customer']
      });
      
      // Mark offline in mechanics collection
      try {
        await updateDoc(doc(db, 'mechanics', user.id), {
          isOnline: false,
          isAvailable: false
        });
      } catch (err) {}

      updateRoleInSession('customer');
      alert("Role switched to Customer! Loading your dashboard...");
      navigate('/dashboard');
    } catch (e) {
      alert("Failed to switch role: " + e.message);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Selected image is too large. Please select an image under 2MB.");
        return;
      }
      
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 128;
        const MAX_HEIGHT = 128;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG Base64
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        // Safety size check
        if (dataUrl.length > 150 * 1024) {
          alert("Image is too complex. Please choose a simpler portrait.");
          return;
        }

        setProfileAvatar(dataUrl);
      };
      img.onerror = () => {
        alert("Invalid image selected.");
      };
    }
  };

  // Centralized realtime GPS coordinates watching for Mechanic
  useEffect(() => {
    let watchId = null;
    if (navigator.geolocation && isOnline) {
      console.log('[GPS] Starting Geolocation watch for online Mechanic...');
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          console.log('[GPS] Continuous Geolocation update (Mechanic):', lat, lng);
          
          setMyLocation({ latitude: lat, longitude: lng });
          
          // 1. Update mechanics/{mechanicId} document
          try {
            await setDoc(doc(db, 'mechanics', user.id), {
              latitude: lat,
              longitude: lng,
              currentLocation: {
                lat,
                lng,
                updatedAt: new Date().toISOString()
              },
              isOnline: true,
              lastLocationUpdate: serverTimestamp()
            }, { merge: true });
          } catch (e) {
            console.error('[GPS] Failed to sync mechanic location to Firestore:', e);
          }

          // 2. If there is an active job, also sync mechanic location directly inside the request ticket
          if (activeJob && activeJob.id) {
            try {
              await setDoc(doc(db, 'requests', activeJob.id), {
                mechanicLatitude: lat,
                mechanicLongitude: lng,
                mechanicLocation: {
                  lat,
                  lng,
                  updatedAt: new Date().toISOString()
                }
              }, { merge: true });
              console.log('[GPS] Synchronized mechanic location inside active request:', activeJob.id);
            } catch (e) {
              console.error('[GPS] Failed to sync mechanic location inside request ticket:', e);
            }
          }
        },
        (error) => {
          console.warn('[GPS] Geolocation watch error (Mechanic):', error.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [user.id, isOnline, activeJob?.id]);

  const detectMyLocation = () => {
    // Retain definition for backward-compatibility checks
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('[GPS] Current location checked.');
        },
        (error) => {}
      );
    }
  };

  const fetchMechanicStats = async () => {
    try {
      const res = await getRequestHistory(user.id, 'mechanic');
      const list = res.data || [];
      setMechanicHistory(list);
      
      const completedJobs = list.filter(r => ['completed', 'reviewed', 'closed'].includes(r.status?.toLowerCase()));
      const totalEarnings = completedJobs.reduce((sum, r) => {
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
      
      // Calculate rating and reviews dynamically strictly from this mechanic's requests
      const reviewedJobs = list.filter(r => r.rating !== undefined && r.rating !== null);
      const totalReviewsCount = reviewedJobs.length;
      const sumRatings = reviewedJobs.reduce((sum, r) => sum + r.rating, 0);
      const calculatedRating = totalReviewsCount > 0 
        ? parseFloat((sumRatings / totalReviewsCount).toFixed(2)) 
        : 0.0;
      
      setStats({
        rating: calculatedRating,
        totalReviews: totalReviewsCount,
        jobsCompleted: completedJobs.length,
        earnings: totalEarnings
      });

      // Keep mechanics collection in sync for other users to see the correct ratings/reviews
      const mechRef = doc(db, 'mechanics', user.id);
      await setDoc(mechRef, {
        rating: calculatedRating,
        totalReviews: totalReviewsCount,
        jobsCompleted: completedJobs.length
      }, { merge: true });
      
    } catch (e) {
      console.error('Failed to load dynamic mechanic stats:', e);
    }
  };

  useEffect(() => {
    // 1. Subscribe to active request in real-time
    const unsubscribeActiveRequest = subscribeToActiveRequest(user.id, 'mechanic', (job) => {
      setActiveJob(job);
      if (!job) {
        setViewState('homepage');
        fetchMechanicStats();
      }
      setLoading(false);
    });

    // 2. Subscribe to incoming requests with strict emergency SOS sorting rules
    let unsubscribeIncomingRequests = () => {};
    if (isOnline) {
      unsubscribeIncomingRequests = subscribeToNearbyRequests((requests) => {
        const sorted = [...requests].sort((a, b) => {
          const aEmerg = a.priority === 'emergency' ? 1 : 0;
          const bEmerg = b.priority === 'emergency' ? 1 : 0;
          if (aEmerg !== bEmerg) return bEmerg - aEmerg;

          const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
          const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
          return bTime - aTime;
        });

        setIncomingRequests(sorted);

        // Instant SOS Emergency Popup modal trigger
        const activeSOS = sorted.find(r => r.priority === 'emergency' && r.status === 'pending');
        if (activeSOS) {
          setCurrentEmergencyRequest(activeSOS);
          setShowEmergencyModal(true);
        } else {
          setShowEmergencyModal(false);
          setCurrentEmergencyRequest(null);
        }
      });
    } else {
      setIncomingRequests([]);
      setShowEmergencyModal(false);
    }

    return () => {
      unsubscribeActiveRequest();
      unsubscribeIncomingRequests();
    };
  }, [user.id, isOnline]);

  // Live Chat Subscriptions (FINAL ISSUE 2 FIXED!)
  useEffect(() => {
    if (activeJob?.id && viewState === 'active_job') {
      const unsubscribeChat = subscribeToMessages(activeJob.id, (messages) => {
        setChatMessages(messages);
        setTimeout(() => {
          chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      });
      return () => unsubscribeChat();
    }
  }, [activeJob?.id, viewState]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeJob?.id) return;
    try {
      await sendMessage(activeJob.id, user.id, user.name, 'mechanic', newMessage);
      setNewMessage('');
    } catch (e) {
      console.error('Failed to send live chat message:', e);
    }
  };

  const toggleOnlineStatus = async () => {
    setStatusUpdating(true);
    const newOnline = !isOnline;
    try {
      await updateMechanicStatus(user.id, newOnline, newOnline);
      setIsOnline(newOnline);
      if (!newOnline) {
        setIncomingRequests([]);
        setShowEmergencyModal(false);
      } else {
        detectMyLocation();
      }
    } catch (e) {
      setIsOnline(newOnline);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAcceptJob = async (jobId) => {
    if (!window.confirm('Accept this roadside rescue job?')) return;
    try {
      const res = await acceptRequest(jobId, user.id);
      
      // Update coordinates in the ticket in Firestore
      await setDoc(doc(db, 'requests', jobId), {
        mechanicLatitude: myLocation.latitude,
        mechanicLongitude: myLocation.longitude
      }, { merge: true });

      setActiveJob(res.data);
      setShowEmergencyModal(false);
      setViewState('active_job');
      alert('Job accepted! Dispatched tracker en-route.');
    } catch (e) {
      alert('Failed to accept job: ' + e.message);
    }
  };

  const handleUpdateJobStatus = async (newStatus) => {
    try {
      const res = await updateRequestStatus(activeJob.id, newStatus);
      setActiveJob(res.data);
      if (newStatus === 'completed') {
        fetchMechanicStats();
        setActiveJob(null);
        setViewState('homepage');
        alert('Job completed! Earnings successfully credited.');
      } else {
        alert(`Status updated: ${newStatus.replace('_', ' ').toUpperCase()}`);
      }
    } catch (e) {
      alert('Failed to update status.');
    }
  };

  // Safe Hydration Loading Screen (Requirement 4)
  if (!hydrationComplete) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-dark text-white">
        <div className="text-center">
          <div className="spinner-border text-warning mb-3" role="status" style={{ width: '3rem', height: '3rem', color: '#FF6B35' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className="font-outfit fw-bold text-white mb-2">Verifying RoadRescue Credentials</h4>
          <p className="text-muted small">Securing your session and loading dispatch feeds...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-dark text-white">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Syncing dispatch channel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark text-white min-vh-100 pb-5" style={{ backgroundColor: '#000' }}>
      
      {/* SOS EMERGENCY FULLSCREEN MODAL */}
      {showEmergencyModal && currentEmergencyRequest && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-danger bg-opacity-95 d-flex flex-column justify-content-center align-items-center" style={{ zIndex: 99999, transition: 'all 0.3s ease' }}>
          <div className="text-center p-4 max-w-500 text-white animate-pulse">
            <i className="fa-solid fa-bell-on display-1 mb-4 text-warning"></i>
            <h1 className="display-4 font-outfit fw-black tracking-wider text-uppercase">CRITICAL SOS DISPATCH</h1>
            <p className="lead text-white-50 mb-4">An emergency rescue beacon was initiated nearby by driver client</p>
          </div>

          <div className="glass-card text-start p-4 mx-3 mb-5 border-0 shadow-lg" style={{ borderRadius: '24px', maxWidth: '500px', backgroundColor: 'rgba(15, 15, 15, 0.95)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <span className="badge bg-danger text-white fw-bold mb-3 text-uppercase font-outfit tracking-wider">High Priority Emergency SOS</span>
            <h4 className="font-outfit fw-black mb-1 text-white">{currentEmergencyRequest.customerName}</h4>
            <p className="small text-muted mb-3"><i className="fa-solid fa-phone me-1 text-success"></i> {currentEmergencyRequest.customerPhone || 'Not Shared'}</p>
            
            <div className="p-3 bg-dark bg-opacity-50 rounded-3 mb-3 border border-secondary border-opacity-10">
              <span className="small text-muted d-block fw-semibold mb-1 text-uppercase tracking-wider">Stranded Location:</span>
              <strong className="text-danger small"><i className="fa-solid fa-location-dot me-1"></i> {currentEmergencyRequest.pickupAddress}</strong>
            </div>

            <p className="small text-muted mb-3"><strong>Stranded Issue:</strong> <span className="text-white">{currentEmergencyRequest.description}</span></p>

            <div className="d-grid mt-2">
              <a href={`tel:${currentEmergencyRequest.customerPhone || ''}`} className="btn btn-success btn-sm py-2.5 rounded-3 fw-bold text-white text-decoration-none text-center">
                <i className="fa-solid fa-phone me-2"></i> Call Stranded Driver
              </a>
            </div>
          </div>

          <div className="d-flex flex-column gap-3 text-center w-100" style={{ maxWidth: '400px' }}>
            <button 
              className="btn btn-warning btn-lg py-3 rounded-pill fw-black font-outfit text-dark shadow-lg animate-bounce"
              onClick={() => handleAcceptJob(currentEmergencyRequest.id)}
              style={{ fontSize: '18px' }}
            >
              ACCEPT EMERGENCY SOS DISPATCH <i className="fa-solid fa-truck-pickup ms-1"></i>
            </button>
            <button 
              className="btn btn-link text-white-50 text-decoration-none small mt-1"
              onClick={() => setShowEmergencyModal(false)}
            >
              Dismiss / Scan other dispatches
            </button>
          </div>
        </div>
      )}

      {/* Orange-accented APK Header Panel */}
      <section className="py-5 px-4 text-start" style={{
        background: 'linear-gradient(180deg, #FF6B35 0%, #E65100 100%)',
        borderBottomLeftRadius: '32px',
        borderBottomRightRadius: '32px'
      }}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <span className="text-white-50 small">Mechanic Portal</span>
               <h2 className="font-outfit fw-black text-white mb-0" style={{ fontSize: '2rem' }}>
                {user.name}
                {mechanicVerified && (
                  <i className="fas fa-certificate text-info ms-2" title="Verified Professional" style={{ fontSize: '1.4rem' }}></i>
                )}
              </h2>
              <button 
                className="btn btn-link text-white p-0 small text-decoration-none fw-bold mt-1" 
                onClick={() => setViewState('profile')}
                style={{ fontSize: '13px', color: '#FFF' }}
              >
                <i className="fa-solid fa-user-gear me-1"></i> My Profile & Settings
              </button>
            </div>
            <div>
              <img 
                src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=FFF&color=000`} 
                style={{ width: '48px', height: '48px', borderRadius: '24px', borderWidth: '2px', borderColor: '#FFF', borderStyle: 'solid' }}
                alt="Avatar" 
              />
            </div>
          </div>

          {/* Profile Editor Card Section (FINAL ISSUE 2 FIXED) */}
          {showProfileEdit && (
            <div className="p-4 mb-4 glass-card animate-fade-in" style={{ backgroundColor: 'rgba(25, 25, 25, 0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px' }}>
              <h5 className="font-outfit fw-bold text-white mb-3"><i className="fa-solid fa-user-gear text-warning me-2"></i> Update Contact Details</h5>
              <div className="row g-3 text-start">
                <div className="col-md-6">
                  <label className="form-label text-muted small fw-semibold">Mobile Phone Number</label>
                  <div className="input-group" style={{ backgroundColor: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' }}>
                    <span className="input-group-text bg-transparent border-0 text-muted ps-3">
                      <i className="fa-solid fa-phone"></i>
                    </span>
                    <input 
                      type="tel" 
                      className="form-control bg-transparent border-0 text-white py-2 ps-1" 
                      placeholder="+91 9876543210"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      style={{ outline: 'none', boxShadow: 'none' }}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small fw-semibold">Emergency Contact (Optional)</label>
                  <div className="input-group" style={{ backgroundColor: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' }}>
                    <span className="input-group-text bg-transparent border-0 text-muted ps-3">
                      <i className="fa-solid fa-heart-pulse"></i>
                    </span>
                    <input 
                      type="tel" 
                      className="form-control bg-transparent border-0 text-white py-2 ps-1" 
                      placeholder="Emergency Contact"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      style={{ outline: 'none', boxShadow: 'none' }}
                    />
                  </div>
                </div>
              </div>

              <div className="row g-3 text-start mt-2">
                <div className="col-md-6">
                  <label className="form-label text-muted small fw-semibold">Specialty</label>
                  <select 
                    className="form-select bg-dark border-secondary border-opacity-35 text-white py-2" 
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    style={{ borderRadius: '12px', border: '1px solid #333' }}
                  >
                    <option value="flat_tire">Tire Repair</option>
                    <option value="battery">Battery Jump</option>
                    <option value="engine">Engine Help</option>
                    <option value="fuel">Fuel Delivery</option>
                    <option value="towing">Towing</option>
                    <option value="other">General Fix</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small fw-semibold">Experience (Years)</label>
                  <input 
                    type="number" 
                    className="form-control bg-dark border-secondary border-opacity-35 text-white py-2" 
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                    style={{ borderRadius: '12px', border: '1px solid #333' }}
                    min="0"
                    max="50"
                  />
                </div>
              </div>

              <div className="col-12 mt-3 text-start">
                <label className="form-label text-muted small fw-semibold">Profile Photo / Custom Avatar</label>
                <div className="d-flex align-items-center gap-3 text-start">
                  <img 
                    src={profileAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=FF6B35&color=FFF`} 
                    style={{ width: '56px', height: '56px', borderRadius: '28px', border: '2px solid #FF6B35', objectFit: 'cover' }}
                    alt="Avatar Preview" 
                  />
                  <div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="form-control form-control-sm bg-dark border-secondary border-opacity-35 text-white" 
                      onChange={handleAvatarChange}
                      style={{ borderRadius: '8px', border: '1px solid #333' }}
                    />
                    <small className="text-muted d-block mt-1" style={{ fontSize: '10px' }}>Select an image (JPEG/WebP under 150KB). Compressed to 128x128.</small>
                  </div>
                </div>
              </div>
              <div className="d-flex gap-2 mt-4 text-start">
                <button 
                  className="btn btn-warning px-4 py-2 fw-bold"
                  onClick={handleProfileSave}
                  disabled={profileSaving || !profilePhone.trim()}
                  style={{ borderRadius: '10px' }}
                >
                  {profileSaving ? <span className="spinner-border spinner-border-sm"></span> : "Save Changes"}
                </button>
                <button 
                  className="btn btn-secondary px-4 py-2"
                  onClick={() => setShowProfileEdit(false)}
                  style={{ borderRadius: '10px' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Availability switch panel */}
          <div className="d-flex justify-content-between align-items-center bg-black bg-opacity-20 p-3" style={{ borderRadius: '20px' }}>
            <div className="d-flex align-items-center gap-2">
              <span className="rounded-circle animate-pulse" style={{ width: '10px', height: '10px', backgroundColor: isOnline ? '#4CAF50' : '#FF5252' }}></span>
              <strong className="text-white small">{isOnline ? 'Scanning for Jobs...' : 'Currently Offline'}</strong>
            </div>
            <div className="form-check form-switch ps-0 mb-0 d-flex align-items-center">
              <input 
                className="form-check-input ms-0 border-0" 
                type="checkbox" 
                role="switch" 
                checked={isOnline}
                onChange={toggleOnlineStatus}
                disabled={statusUpdating}
                style={{ width: '45px', height: '22px', backgroundColor: isOnline ? '#4CAF50' : '#888', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats row cards */}
      <div className="container mt-n3" style={{ marginTop: '-30px' }}>
        <div className="row g-3 px-3">
          <div className="col-4">
            <div className="card text-center p-3 border-0 shadow" style={{ borderRadius: '20px', backgroundColor: 'rgba(20, 20, 20, 0.75)', border: '1px solid #2a2a2a', color: '#FFF' }}>
              <strong className="d-block font-outfit text-white" style={{ fontSize: stats.totalReviews > 0 ? '18px' : '12px' }}>
                {stats.totalReviews > 0 ? stats.rating : 'No ratings yet'}
              </strong>
              <small className="text-muted small">{stats.totalReviews > 0 ? `${stats.totalReviews} Reviews` : 'Rating'}</small>
              <i className="fa-solid fa-star text-warning mt-2 small"></i>
            </div>
          </div>
          <div className="col-4">
            <div className="card text-center p-3 border-0 shadow" style={{ borderRadius: '20px', backgroundColor: 'rgba(20, 20, 20, 0.75)', border: '1px solid #2a2a2a', color: '#FFF' }}>
              <strong className="d-block font-outfit text-white" style={{ fontSize: '18px' }}>{stats.jobsCompleted}</strong>
              <small className="text-muted small">Jobs</small>
              <i className="fa-solid fa-briefcase mt-2 small" style={{ color: '#FF6B35' }}></i>
            </div>
          </div>
          <div className="col-4">
            <div className="card text-center p-3 border-0 shadow" style={{ borderRadius: '20px', backgroundColor: 'rgba(20, 20, 20, 0.75)', border: '1px solid #2a2a2a', color: '#FFF' }}>
              <strong className="d-block font-outfit text-white" style={{ fontSize: '18px' }}>₹{stats.earnings}</strong>
              <small className="text-muted small">Earnings</small>
              <i className="fa-solid fa-wallet text-success mt-2 small"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="container mt-4 px-3">
        {viewState === 'active_job' && activeJob ? (
          /* ========================================================================= */
          /* LIVE ACTIVE ASSIGNED JOB TRACKER SCREEN                                   */
          /* ========================================================================= */
          <div className="row g-4 animate-fade-in text-start">
            
            {/* Back button */}
            <div className="col-12 mb-1">
              <button className="btn btn-outline-warning btn-sm rounded-pill px-3" onClick={() => setViewState('homepage')} style={{ borderColor: 'rgba(255,107,53,0.3)', color: '#FF6B35' }}>
                <i className="fa-solid fa-arrow-left me-2"></i> Return to Console
              </button>
            </div>

            {/* Navigation Tracking Map */}
            <div className="col-lg-8">
              <div className="glass-card p-3" style={{ height: '480px', backgroundColor: 'rgba(20,20,20,0.7)', border: '1px solid #2a2a2a', borderRadius: '24px' }}>
                <RoadRescueMap 
                  customerLocation={{ latitude: activeJob.pickupLatitude, longitude: activeJob.pickupLongitude }}
                  mechanicLocation={myLocation}
                  customerAddress={activeJob.pickupAddress}
                  zoom={14}
                />
              </div>
            </div>

            {/* Assigned Job detail controls */}
            <div className="col-lg-4">
              <div className="glass-card p-4 h-100 d-flex flex-column justify-content-between" style={{ backgroundColor: 'rgba(20,20,20,0.7)', border: '1px solid #2a2a2a', borderRadius: '24px', minHeight: '480px' }}>
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25 fw-bold"><i className="fa-solid fa-circle-exclamation me-1 animate-pulse"></i> Assigned Repair</span>
                    <span className="badge bg-warning text-dark font-outfit fw-bold text-uppercase">{activeJob.status}</span>
                  </div>

                  <h4 className="font-outfit fw-bold text-white mb-2">
                    {SERVICES.find(s => s.id === activeJob.issueType)?.label || activeJob.issueType.replace('_', ' ').toUpperCase()}
                  </h4>
                  <p className="small text-muted mb-3">{activeJob.description}</p>
                  
                  <hr className="border-secondary" />

                  {/* Customer Info Box with Click-to-Call (FINAL ISSUE 3 FIXED!) */}
                  <div className="p-3 bg-dark bg-opacity-50 border border-secondary border-opacity-15 rounded-3 mb-3">
                    <div className="fw-bold font-outfit text-white mb-2 fs-xs"><i className="fa-solid fa-circle-user text-warning me-2"></i> Client Details</div>
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="text-muted">Driver Name:</span>
                      <span className="fw-bold text-white">{activeJob.customerName || 'Driver Client'}</span>
                    </div>
                    <div className="d-flex justify-content-between small mb-2">
                      <span className="text-muted">Phone Number:</span>
                      <span className="fw-bold text-white">{activeJob.customerPhone || 'Not Shared'}</span>
                    </div>
                    <div className="d-grid mt-2">
                      <a href={`tel:${customerLatestPhone || activeJob.customerPhone || ''}`} className="btn btn-success btn-sm py-2 rounded-3 fw-bold text-white text-decoration-none text-center">
                        <i className="fa-solid fa-phone me-1"></i> Call Customer
                      </a>
                    </div>
                  </div>

                  <hr className="border-secondary border-opacity-30" />

                  {/* Stepper updates triggers */}
                  <div className="mb-4">
                    <div className="fw-bold text-white mb-3 small"><i className="fa-solid fa-route text-warning me-2"></i> Repair Dispatch Milestones</div>
                    
                    {activeJob.status.toLowerCase() === 'accepted' && (
                      <button 
                        className="btn btn-warning w-100 py-3 rounded-3 fw-bold font-outfit text-dark"
                        onClick={() => handleUpdateJobStatus('en_route')}
                        style={{ borderRadius: '12px' }}
                      >
                        🚀 Update: I am EN ROUTE
                      </button>
                    )}

                    {activeJob.status.toLowerCase() === 'en_route' && (
                      <button 
                        className="btn btn-info w-100 py-3 rounded-3 fw-bold font-outfit text-white"
                        onClick={() => handleUpdateJobStatus('arrived')}
                        style={{ borderRadius: '12px', backgroundColor: '#2979FF', border: 'none' }}
                      >
                        📍 Update: I have ARRIVED
                      </button>
                    )}

                    {activeJob.status.toLowerCase() === 'arrived' && (
                      <button 
                        className="btn btn-warning w-100 py-3 rounded-3 fw-bold font-outfit text-dark"
                        onClick={() => handleUpdateJobStatus('in_progress')}
                        style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', border: 'none' }}
                      >
                        🔧 Update: Start REPAIRS
                      </button>
                    )}

                    {activeJob.status.toLowerCase() === 'in_progress' && (
                      <button 
                        className="btn btn-success w-100 py-3 rounded-3 fw-bold font-outfit text-white"
                        onClick={() => handleUpdateJobStatus('completed')}
                        style={{ borderRadius: '12px', backgroundColor: '#00C853', border: 'none' }}
                      >
                        ✅ Complete Repairs (Close Job)
                      </button>
                    )}
                  </div>

                  {/* Real-time Live Chat Widget (FINAL ISSUE 2 FIXED!) */}
                  {activeJob.customerName && (
                    <div className="mb-4 text-start">
                      <h6 className="font-outfit fw-bold text-white mb-2 fs-xs"><i className="fa-solid fa-comments text-warning me-2"></i> Live Rescue Chat</h6>
                      <div className="chat-messages-container d-flex flex-column gap-2 p-2 mb-2" id="chat-container">
                        {chatMessages.length === 0 ? (
                          <div className="text-center my-auto text-muted small">
                            Secure direct chat channel opened. Type a message below.
                          </div>
                        ) : (
                          chatMessages.map((msg) => {
                            const isSelf = msg.senderId === user.id;
                            const isSystem = msg.senderId === 'system';
                            const formattedTime = msg.createdAt?.seconds 
                              ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                              : '';
                            
                            if (isSystem) {
                              return (
                                <div key={msg.id} className="text-center my-2 px-3 py-1 bg-secondary bg-opacity-10 border border-secondary border-opacity-15 rounded-3 text-muted small mx-auto" style={{ maxWidth: '90%', fontSize: '11px' }}>
                                  <i className="fa-solid fa-circle-info text-warning me-1"></i> {msg.text}
                                </div>
                              );
                            }

                            return (
                              <div key={msg.id} className={`chat-bubble ${isSelf ? 'self' : 'other'}`}>
                                <div className="d-flex justify-content-between gap-3 mb-0.5" style={{ fontSize: '10px', opacity: 0.8 }}>
                                  <span className="fw-bold">{msg.senderName}</span>
                                  <span>{formattedTime}</span>
                                </div>
                                <div style={{ wordBreak: 'break-word' }}>{msg.text}</div>
                              </div>
                            );
                          })
                        )}
                        <div ref={chatBottomRef} />
                      </div>
                      <form onSubmit={handleSendMessage} className="d-flex gap-2">
                        <input 
                          type="text" 
                          className="form-control bg-dark border-secondary border-opacity-35 text-white py-2" 
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          style={{ borderRadius: '10px', fontSize: '13px' }}
                        />
                        <button type="submit" className="btn btn-warning px-3 fw-bold" style={{ borderRadius: '10px' }} disabled={!newMessage.trim()}>
                          <i className="fa-solid fa-paper-plane"></i>
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                <div className="d-grid mt-4">
                  <button className="btn btn-dark text-muted py-2" onClick={() => alert('Real-time listener onSnapshot updates all fields automatically.')} style={{ borderRadius: '12px', border: '1px solid #333' }}>
                    <i className="fa-solid fa-circle-check me-2"></i> Live Sync Activated
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : viewState === 'profile' ? (
          /* ========================================================================= */
          /* PROFILE SETTINGS VIEWSTATE                                                */
          /* ========================================================================= */
          <div className="container mt-2 px-3 text-start animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
            {/* Header */}
            <div className="d-flex align-items-center gap-3 mb-4">
              <button className="btn btn-outline-warning btn-sm rounded-pill px-3" onClick={() => setViewState('homepage')} style={{ borderColor: 'rgba(255,107,53,0.3)', color: '#FF6B35' }}>
                <i className="fa-solid fa-arrow-left me-2"></i> Back
              </button>
              <h3 className="font-outfit fw-bold text-white mb-0">Mechanic Settings</h3>
            </div>

            <div className="text-center py-4 rounded-4 mb-4 shadow position-relative" style={{ background: 'linear-gradient(180deg, #1A1A1A 0%, #000000 100%)', border: '1px solid #333' }}>
              <div className="d-inline-block position-relative mb-3">
                <img 
                  src={profileAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=FF6B35&color=FFF`} 
                  style={{ width: '100px', height: '100px', borderRadius: '50px', objectFit: 'cover', border: '3px solid #FF6B35' }}
                  alt="Avatar"
                  onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=FF6B35&color=FFF` }}
                />
                <label htmlFor="avatar-file-input" className="position-absolute bottom-0 end-0 bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center border border-2 border-dark" style={{ width: '32px', height: '32px', cursor: 'pointer' }}>
                  <i className="fa-solid fa-camera" style={{ fontSize: '14px' }}></i>
                </label>
                <input 
                  id="avatar-file-input"
                  type="file" 
                  accept="image/*" 
                  className="d-none" 
                  onChange={handleAvatarChange}
                />
              </div>
              <h4 className="font-outfit fw-black text-white mb-1">
                {user.name}
                {mechanicVerified && <i className="fas fa-certificate text-info ms-2" title="Verified Professional"></i>}
              </h4>
              <p className="small text-muted mb-0">{user.email}</p>
              <span className="badge bg-warning bg-opacity-10 text-warning mt-2 px-3 py-1.5 rounded-pill font-outfit" style={{ border: '1px solid rgba(255,107,53,0.2)' }}>
                🔧 RoadRescue Mechanic Partner
              </span>
            </div>

            {/* Profile Menu Items */}
            <div className="glass-card overflow-hidden mb-4" style={{ backgroundColor: 'rgba(20,20,20,0.7)', border: '1px solid #2a2a2a', borderRadius: '24px' }}>
              <div className="list-group list-group-flush bg-transparent">
                <button className="list-group-item list-group-item-action bg-transparent border-secondary border-opacity-10 text-white d-flex align-items-center justify-content-between p-3" onClick={() => setShowProfileEdit(true)}>
                  <span className="d-flex align-items-center"><i className="fa-solid fa-user-edit text-muted me-3 fs-5" style={{ width: '24px' }}></i> Edit Profile</span>
                  <i className="fa-solid fa-chevron-right text-muted small"></i>
                </button>
                <button className="list-group-item list-group-item-action bg-transparent border-secondary border-opacity-10 text-white d-flex align-items-center justify-content-between p-3" onClick={() => setViewState('reviews')}>
                  <span className="d-flex align-items-center"><i className="fa-solid fa-star text-muted me-3 fs-5" style={{ width: '24px' }}></i> Ratings & Reviews ({stats.totalReviews})</span>
                  <i className="fa-solid fa-chevron-right text-muted small"></i>
                </button>
                <button className="list-group-item list-group-item-action bg-transparent border-secondary border-opacity-10 text-white d-flex align-items-center justify-content-between p-3" onClick={handleSwitchToCustomer}>
                  <span className="d-flex align-items-center"><i className="fa-solid fa-rotate text-muted me-3 fs-5" style={{ width: '24px' }}></i> Switch to Customer</span>
                  <i className="fa-solid fa-chevron-right text-muted small"></i>
                </button>
                <button className="list-group-item list-group-item-action bg-transparent border-secondary border-opacity-10 text-white d-flex align-items-center justify-content-between p-3" onClick={() => setInfoModalContent({
                  title: 'Notifications',
                  body: ['Welcome to RoadRescue! Your profile is verified.', 'Active dispatches: Scanning for drivers within 25km.', 'Alert: Completed jobs will be updated on your profile stats.'],
                  icon: 'fa-bell text-warning'
                })}>
                  <span className="d-flex align-items-center"><i className="fa-solid fa-bell text-muted me-3 fs-5" style={{ width: '24px' }}></i> Notifications</span>
                  <i className="fa-solid fa-chevron-right text-muted small"></i>
                </button>
                <button className="list-group-item list-group-item-action bg-transparent border-secondary border-opacity-10 text-white d-flex align-items-center justify-content-between p-3" onClick={() => setInfoModalContent({
                  title: 'Privacy & Security',
                  body: ['Your data is protected with AES-256 encryption.', 'We never share your location data unless you are actively scanning for client jobs.'],
                  icon: 'fa-lock-open text-success'
                })}>
                  <span className="d-flex align-items-center"><i className="fa-solid fa-lock text-muted me-3 fs-5" style={{ width: '24px' }}></i> Privacy & Security</span>
                  <i className="fa-solid fa-chevron-right text-muted small"></i>
                </button>
                <button className="list-group-item list-group-item-action bg-transparent border-secondary border-opacity-10 text-white d-flex align-items-center justify-content-between p-3" onClick={() => window.open('mailto:nandunandivardhan7@gmail.com?subject=RoadRescue Support Request')}>
                  <span className="d-flex align-items-center"><i className="fa-solid fa-circle-question text-muted me-3 fs-5" style={{ width: '24px' }}></i> Help & Support</span>
                  <i className="fa-solid fa-chevron-right text-muted small"></i>
                </button>
                <button className="list-group-item list-group-item-action bg-transparent border-secondary border-opacity-10 text-white d-flex align-items-center justify-content-between p-3" onClick={() => setInfoModalContent({
                  title: 'About RoadRescue',
                  body: ['Version 1.0', 'Designed for ultimate roadside peace of mind.', 'Connecting professionals with drivers in distress.'],
                  icon: 'fa-circle-info text-primary'
                })}>
                  <span className="d-flex align-items-center"><i className="fa-solid fa-info-circle text-muted me-3 fs-5" style={{ width: '24px' }}></i> About RoadRescue</span>
                  <i className="fa-solid fa-chevron-right text-muted small"></i>
                </button>
              </div>
            </div>

            <div className="d-grid gap-2">
              <button className="btn btn-outline-danger py-3 fw-bold rounded-3" onClick={logoutUser}>
                <i className="fa-solid fa-sign-out-alt me-2"></i> Log Out
              </button>
            </div>
          </div>
        ) : viewState === 'reviews' ? (
          /* ========================================================================= */
          /* RATINGS & REVIEWS INSPECTION VIEWSTATE                                    */
          /* ========================================================================= */
          <div className="container mt-2 px-3 text-start animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
            {/* Header */}
            <div className="d-flex align-items-center gap-3 mb-4">
              <button className="btn btn-outline-warning btn-sm rounded-pill px-3" onClick={() => setViewState('profile')} style={{ borderColor: 'rgba(255,107,53,0.3)', color: '#FF6B35' }}>
                <i className="fa-solid fa-arrow-left me-2"></i> Back
              </button>
              <h3 className="font-outfit fw-bold text-white mb-0">Ratings & Reviews</h3>
            </div>

            <div className="glass-card p-4 mb-4 text-center" style={{ backgroundColor: 'rgba(20,20,20,0.7)', border: '1px solid #2a2a2a', borderRadius: '24px' }}>
              <h1 className="font-outfit fw-black text-warning display-5 mb-1" style={{ fontSize: stats.totalReviews > 0 ? '3rem' : '1.75rem' }}>
                {stats.totalReviews > 0 ? stats.rating : 'No ratings yet'}
              </h1>
              <div className="d-flex justify-content-center text-warning gap-1 mb-2">
                {stats.totalReviews > 0 ? (
                  [1, 2, 3, 4, 5].map((s) => (
                    <i key={s} className={`${s <= Math.round(stats.rating || 0) ? 'fa-solid' : 'fa-regular'} fa-star`}></i>
                  ))
                ) : (
                  [1, 2, 3, 4, 5].map((s) => (
                    <i key={s} className="fa-regular fa-star text-muted"></i>
                  ))
                )}
              </div>
              <p className="text-muted small mb-0">Based on {stats.totalReviews} total customer reviews</p>
            </div>

            <div className="glass-card p-4" style={{ backgroundColor: 'rgba(20,20,20,0.7)', border: '1px solid #2a2a2a', borderRadius: '24px' }}>
              <h5 className="font-outfit fw-bold text-white mb-3"><i className="fa-solid fa-comments text-warning me-2"></i> Client Reviews</h5>
              {mechanicHistory.filter(h => h.rating !== undefined && h.rating !== null).length === 0 ? (
                <div className="text-center py-4 text-muted small">
                  No written reviews or ratings left yet.
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {mechanicHistory.filter(h => h.rating !== undefined && h.rating !== null).map((rev) => (
                    <div key={rev.id} className="p-3 rounded-3 border border-secondary border-opacity-15 bg-dark bg-opacity-30">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-bold font-outfit text-white text-sm">{rev.customerName || 'Anonymous Driver'}</span>
                        <div className="d-flex text-warning gap-0.5" style={{ fontSize: '12px' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <i key={s} className={`${s <= rev.rating ? 'fa-solid' : 'fa-regular'} fa-star`}></i>
                          ))}
                        </div>
                      </div>
                      <p className="small text-muted mb-0">{rev.ratingComment || 'No comments left.'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* PENDING REQUESTS SCANNER HOMEPAGE                                         */
          /* ========================================================================= */
          <div className="row g-4 animate-fade-in text-start">
            
            {/* Active Job Alert Banner */}
            {activeJob && (
              <div className="col-12 mt-2">
                <div 
                  className="alert bg-danger text-white p-3 border-0 d-flex justify-content-between align-items-center mb-0 shadow-lg" 
                  style={{ 
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #FF6B35 0%, #E65100 100%)' 
                  }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-dark rounded-circle d-flex justify-content-center align-items-center" style={{ width: '44px', height: '44px', color: '#FFF' }}>
                      <i className="fa-solid fa-circle-exclamation fs-5 animate-pulse"></i>
                    </div>
                    <div>
                      <strong className="d-block" style={{ fontSize: '15px' }}>Assigned Active Job In Progress</strong>
                      <small style={{ fontSize: '11px' }}>Client: {activeJob.customerName} - Status: {activeJob.status.toUpperCase()}</small>
                    </div>
                  </div>
                  <button className="btn btn-light btn-sm rounded-pill px-4 fw-bold text-dark" onClick={() => setViewState('active_job')}>
                    View Live Tracker <i className="fa-solid fa-chevron-right ms-1"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Dispatch scanner console list */}
            <div className="col-lg-8">
              <div className="glass-card p-4" style={{ backgroundColor: 'rgba(20,20,20,0.7)', border: '1px solid #2a2a2a', borderRadius: '24px' }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="font-outfit fw-bold text-white mb-0">
                    <i className="fa-solid fa-tower-broadcast text-danger me-2"></i> Available Requests ({incomingRequests.length})
                  </h4>
                </div>

                {isOnline ? (
                  incomingRequests.length === 0 ? (
                    /* Scanning Radar View */
                    <div className="text-center py-5 border border-secondary border-opacity-15 rounded-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: '#333' }}>
                      <i className="fa-solid fa-satellite-dish text-muted display-4 mb-3 animate-pulse"></i>
                      <h5 className="font-outfit fw-bold text-white mb-1">Scanning Area...</h5>
                      <p className="text-muted small mb-0 px-3">No pending service requests found within 25km. We will alert you immediately when someone needs roadside rescue!</p>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {incomingRequests.map((req) => {
                        const isEmerg = req.priority === 'emergency';
                        return (
                          <div className="col-md-6" key={req.id}>
                            <div 
                              className={`glass-card p-3 border-secondary border-opacity-15 ${isEmerg ? 'bg-danger bg-opacity-10' : 'bg-dark bg-opacity-70'}`} 
                              style={{ 
                                borderRadius: '20px', 
                                border: isEmerg ? '2px solid #FF1744' : '1px solid #2d2d2d',
                                animation: isEmerg ? 'pulse 2s infinite' : 'none' 
                              }}
                            >
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <span className={`badge fw-bold text-uppercase fs-xxs ${isEmerg ? 'bg-danger text-white' : 'bg-warning text-dark'}`}>
                                  {SERVICES.find(s => s.id === req.issueType)?.label || req.issueType.replace('_', ' ').toUpperCase()}
                                  {isEmerg && ' [SOS EMERGENCY]'}
                                </span>
                                <span className="fw-bold font-outfit text-warning">₹{req.estimatedCost}</span>
                              </div>
                              
                              <h6 className="font-outfit fw-bold text-white mb-1">Driver: {req.customerName || 'Driver Client'}</h6>
                              <p className="small text-muted text-truncate mb-2">{req.description || 'Stranded vehicle requiring immediate repairs'}</p>
                              
                              <div className="rounded p-2 mb-3 border border-secondary border-opacity-15 small" style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderColor: '#333' }}>
                                <i className="fa-solid fa-location-arrow me-2 text-danger"></i>
                                <span className="text-muted text-truncate d-inline-block" style={{ maxWidth: '90%' }}>{req.pickupAddress}</span>
                              </div>

                              <div className="d-grid">
                                <button 
                                  className={`btn py-2 btn-sm fw-bold font-outfit ${isEmerg ? 'btn-danger text-white' : 'btn-warning text-dark'}`}
                                  onClick={() => handleAcceptJob(req.id)}
                                  style={{ borderRadius: '12px' }}
                                >
                                  {isEmerg ? 'ACCEPT SOS & DEPLOY' : 'Accept Job & Deploy'} <i className="fa-solid fa-truck-pickup ms-1"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  /* Offline guidance placeholder */
                  <div className="text-center py-5 border border-secondary border-opacity-15 rounded-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: '#333' }}>
                    <i className="fa-solid fa-moon text-muted display-4 mb-3"></i>
                    <h5 className="font-outfit fw-bold text-white mb-1">You're Offline</h5>
                    <p className="text-muted small px-3 mb-0">Go online using the switch switch in the header panel to start receiving real-time dispatches in your region.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Completed Repair Log Section */}
            <div className="col-lg-8 mb-4">
              <div className="glass-card p-4 animate-fade-in" style={{ backgroundColor: 'rgba(20,20,20,0.7)', border: '1px solid #2a2a2a', borderRadius: '24px' }}>
                <h4 className="font-outfit fw-bold text-white mb-3">
                  <i className="fa-solid fa-clock-rotate-left text-warning me-2"></i> Completed Repair Log
                </h4>

                {mechanicHistory.length === 0 ? (
                  <div className="text-center py-4 text-muted small">
                    No past completed repairs found in your portal account.
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3 overflow-auto" style={{ maxHeight: '350px' }}>
                    {mechanicHistory.map((item) => {
                      const sInfo = SERVICES.find(s => s.id === item.issueType) || { label: 'General Fix', icon: 'fa-solid fa-wrench', color: '#6B7280' };
                      const dt = item.createdAt?.seconds 
                        ? new Date(item.createdAt.seconds * 1000).toLocaleString() 
                        : new Date().toLocaleString();
                      const isDone = ['completed', 'reviewed', 'closed'].includes(item.status?.toLowerCase());
                      return (
                        <div 
                          key={item.id} 
                          className="p-3 rounded-3 border border-secondary border-opacity-15 bg-dark bg-opacity-30 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2"
                        >
                          <div className="d-flex align-items-center gap-3 text-start">
                            <div className="p-2.5 rounded-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: sInfo.color + '15', width: '45px', height: '45px' }}>
                              <i className={`${sInfo.icon} fs-4`} style={{ color: sInfo.color }}></i>
                            </div>
                            <div>
                              <h6 className="mb-0 font-outfit text-white fw-bold">{sInfo.label} Repair {item.priority === 'emergency' && <span className="badge bg-danger text-white fs-xxs ms-1">SOS</span>}</h6>
                              <small className="text-muted d-block mt-0.5" style={{ fontSize: '11.5px' }}>
                                Date/Time: <strong>{dt}</strong> • Stranded Driver: <strong>{item.customerName || 'Driver Client'}</strong> • Mechanic: <strong>{user.name}</strong>
                              </small>
                              {item.rating && (
                                <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                                  <div className="text-warning small d-flex align-items-center gap-0.5">
                                    {Array.from({ length: item.rating }).map((_, i) => (
                                      <i key={i} className="fa-solid fa-star small"></i>
                                    ))}
                                  </div>
                                  {item.ratingComment && <span className="text-muted small italic">"{item.ratingComment}"</span>}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-md-end text-start">
                            <span className="fw-bold text-white d-block">
                              ₹{(() => {
                                let cost = parseFloat(item.actualCost || item.estimatedCost);
                                if (isNaN(cost)) {
                                  const serviceCosts = {
                                    'flat_tire': 450,
                                    'battery': 600,
                                    'engine': 1200,
                                    'fuel': 300,
                                    'towing': 2500,
                                    'other': 500
                                  };
                                  cost = serviceCosts[item.issueType] || 0;
                                }
                                return cost;
                              })()}
                            </span>
                            <span className={`badge rounded-pill text-uppercase fs-xxs ${isDone ? 'bg-success bg-opacity-15 text-success' : 'bg-danger bg-opacity-15 text-danger'}`}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Offline Guidance & Tools */}
            <div className="col-lg-4">
              
              {/* Mechanic Tools */}
              <div className="glass-card p-4 mb-4" style={{ backgroundColor: 'rgba(20,20,20,0.7)', border: '1px solid #2a2a2a', borderRadius: '24px' }}>
                <h5 className="font-outfit fw-bold text-white mb-3"><i className="fa-solid fa-toolbox text-warning me-2"></i> Mechanic Tools</h5>
                <ul className="list-unstyled mb-0 d-flex flex-column gap-2 small">
                  <li className="d-flex align-items-center justify-content-between p-2.5 bg-secondary bg-opacity-5 rounded border border-secondary border-opacity-15">
                    <span><i className="fa-solid fa-map text-warning me-2"></i> Service Area Boundaries</span>
                    <span className="badge bg-secondary">25 KM</span>
                  </li>
                  <li className="d-flex align-items-center justify-content-between p-2.5 bg-secondary bg-opacity-5 rounded border border-secondary border-opacity-15">
                    <span><i className="fa-solid fa-triangle-exclamation text-danger me-2"></i> Critical Alerts</span>
                    <span className="badge bg-danger">0 Alerts</span>
                  </li>
                </ul>
              </div>

              {/* Red logout button */}
              <div className="d-grid mb-4">
                <button 
                  className="btn btn-outline-danger py-3 fw-bold rounded-3 border border-danger border-opacity-35" 
                  onClick={logoutUser}
                  style={{ borderRadius: '12px' }}
                >
                  <i className="fa-solid fa-sign-out me-2"></i> Sign Out from Portal
                </button>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Dynamic Info Modal */}
      {infoModalContent && (
        <div className="modal fade show d-block animate-fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 99999 }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content bg-dark text-white border-secondary" style={{ borderRadius: '24px', border: '1px solid #333' }}>
              <div className="modal-body text-center p-4">
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-secondary bg-opacity-10 mb-3" style={{ width: '64px', height: '64px' }}>
                  <i className={`fa-solid ${infoModalContent.icon} fs-2`}></i>
                </div>
                <h4 className="font-outfit fw-black text-white mb-3">{infoModalContent.title}</h4>
                <div className="text-start mb-4">
                  {infoModalContent.body.map((paragraph, index) => (
                    <p key={index} className="small text-muted mb-2" style={{ lineHeight: '1.6' }}>{paragraph}</p>
                  ))}
                </div>
                <div className="d-grid">
                  <button type="button" className="btn btn-warning fw-bold py-2.5" style={{ borderRadius: '12px', color: '#000' }} onClick={() => setInfoModalContent(null)}>
                    Got it
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

export default MechanicDashboard;
