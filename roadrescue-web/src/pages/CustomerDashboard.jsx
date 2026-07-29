import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RoadRescueMap from '../components/MapContainer';
import { 
  createServiceRequest, 
  cancelRequest, 
  getRequestHistory, 
  subscribeToActiveRequest,
  subscribeToOnlineMechanics,
  sendMessage,
  subscribeToMessages,
  updateUserProfilePhone
} from '../services/api';
import { doc, setDoc, updateDoc, getDoc, serverTimestamp, getDocs, collection, onSnapshot, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const MOCK_LOCATIONS = [
  { name: 'NH-48 Expressway, Sector 31', latitude: 28.4595, longitude: 77.0266 },
  { name: 'Cyber City Tech Park, Phase 3', latitude: 28.4950, longitude: 77.0878 },
  { name: 'Delhi Border toll gate, NH-8', latitude: 28.5036, longitude: 77.0984 },
  { name: 'Sohna Road, Badshahpur Hub', latitude: 28.3973, longitude: 77.0425 }
];

const SERVICES = [
  { id: 'flat_tire', label: 'Tire Repair', icon: 'fa-solid fa-circle-notch', color: '#FF6B35', cost: 450 },
  { id: 'battery', label: 'Battery Jump', icon: 'fa-solid fa-car-battery', color: '#2979FF', cost: 600 },
  { id: 'engine', label: 'Engine Help', icon: 'fa-solid fa-gauge-high', color: '#FF1744', cost: 1200 },
  { id: 'fuel', label: 'Fuel Delivery', icon: 'fa-solid fa-gas-pump', color: '#FFB300', cost: 300 },
  { id: 'towing', label: 'Towing', icon: 'fa-solid fa-truck-pickup', color: '#00C853', cost: 2500 },
  { id: 'other', label: 'General Fix', icon: 'fa-solid fa-screwdriver-wrench', color: '#6B7280', cost: 500 },
];

const CustomerDashboard = () => {
  const { user, logoutUser, updatePhoneInSession, updateRoleInSession } = useAuth();
  const navigate = useNavigate();
  const [activeJob, setActiveJob] = useState(null);
  const [history, setHistory] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile management states (FINAL ISSUE 2 FIXED)
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileName, setProfileName] = useState(user.name || '');
  const [profilePhone, setProfilePhone] = useState(user.phone || '');
  const [profileAvatar, setProfileAvatar] = useState(user.avatarUrl || user.avatar || '');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Saved vehicles and emergency contacts
  const [vehicles, setVehicles] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);

  // Vehicles Form
  const [newVehicle, setNewVehicle] = useState({ make: '', model: '', year: '', color: '', plateNumber: '' });
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState(null);

  // Contacts Form
  const [newContact, setNewContact] = useState({ name: '', relationship: '', phone: '' });
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editingContactId, setEditingContactId] = useState(null);

  // Modal State
  const [infoModalContent, setInfoModalContent] = useState(null);
  
  // Realtime synced mechanic phone state (FINAL ISSUE 2 FIXED)
  const [mechanicLatestPhone, setMechanicLatestPhone] = useState('');
  const [mechanicVerified, setMechanicVerified] = useState(false);

  // Workflow states matching APK screens
  // 'homepage' | 'nearby_mechanics' | 'request_help' | 'sos' | 'tracking'
  const [viewState, setViewState] = useState('homepage');

  // Selected Service & Mechanic for multi-step flow
  const [selectedService, setSelectedService] = useState(SERVICES[0]);
  const [selectedLocation, setSelectedLocation] = useState(MOCK_LOCATIONS[0]);
  const [selectedMechanic, setSelectedMechanic] = useState(null);

  // Form states
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [description, setDescription] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);

  // SOS specific states
  const [isSOS, setIsSOS] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(-1);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(true);

  // Rating review states
  const [userRating, setUserRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Live Chat System states (FINAL ISSUE 2 FIXED!)
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatBottomRef = useRef(null);

  const [membershipTier, setMembershipTier] = useState('Standard');

  // 1. Load latest profile details from Firestore on mount
  useEffect(() => {
    // 3. STRICT CUSTOMER VALIDATION
    if (!user || (user.role?.toLowerCase() !== 'customer' && user.role?.toLowerCase() !== 'user')) {
      console.log('Access denied: User is not a customer');
      navigate('/mechanic');
      return;
    }

    const fetchLatestProfile = async () => {
      try {
        const uDoc = await getDoc(doc(db, 'users', user.id));
        if (uDoc.exists()) {
          const data = uDoc.data();
          setProfileName(data.name || '');
          setProfilePhone(data.phone || data.phoneNumber || '');
          setProfileAvatar(data.avatarUrl || data.avatar || '');
          setEmergencyContact(data.emergencyContact || '');
          setMembershipTier(data.membership || 'Standard');
          
          const dbName = data.name || '';
          const dbPhone = data.phone || data.phoneNumber || '';
          const dbAvatar = data.avatarUrl || data.avatar || '';
          if (dbPhone !== user.phone || dbAvatar !== user.avatarUrl || dbName !== user.name) {
            updatePhoneInSession(dbPhone, dbAvatar, dbName);
          }
        }
      } catch (e) {
        console.error('Failed to fetch latest profile:', e);
      }
    };
    fetchLatestProfile();
  }, [user?.id, navigate]);

  // Realtime onSnapshot listener for mechanic phone updates (FINAL ISSUE 2 FIXED)
  useEffect(() => {
    if (activeJob?.mechanicId) {
      const unsub = onSnapshot(doc(db, 'users', activeJob.mechanicId), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setMechanicLatestPhone(data.phone || data.phoneNumber || '');
        }
      });
      return () => unsub();
    } else {
      setMechanicLatestPhone('');
    }
  }, [activeJob?.mechanicId]);

  // Real-time listener for mechanic verification changes
  useEffect(() => {
    if (activeJob?.mechanicId) {
      const unsub = onSnapshot(doc(db, 'mechanics', activeJob.mechanicId), (docSnap) => {
        if (docSnap.exists()) {
          setMechanicVerified(docSnap.data().verified === true);
        } else {
          setMechanicVerified(false);
        }
      });
      return () => unsub();
    } else {
      setMechanicVerified(false);
    }
  }, [activeJob?.mechanicId]);

  // Real-time listener for emergency contacts (Requirement 1)
  useEffect(() => {
    if (!user?.id) return;
    const unsub = onSnapshot(collection(db, 'users', user.id, 'emergencyContacts'), (snapshot) => {
      const contactsList = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setEmergencyContacts(contactsList);
    }, (error) => {
      console.error('[EmergencyContacts] Listener failed:', error);
    });
    return () => unsub();
  }, [user?.id]);

  // Real-time listener for saved vehicles (Requirement 2)
  useEffect(() => {
    if (!user?.id) return;
    const unsub = onSnapshot(collection(db, 'users', user.id, 'vehicles'), (snapshot) => {
      const vehicleList = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setVehicles(vehicleList);
    }, (error) => {
      console.error('[Vehicles] Listener failed:', error);
    });
    return () => unsub();
  }, [user?.id]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Selected image is too large. Please select an image under 2MB.");
        return;
      }
      
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = async () => {
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
        try {
          await setDoc(doc(db, 'users', user.id), {
            avatar: dataUrl,
            avatarUrl: dataUrl,
            updatedAt: serverTimestamp()
          }, { merge: true });
          updatePhoneInSession(profilePhone, dataUrl);
        } catch (err) {
          console.error("Failed to save avatar instantly:", err);
        }
      };
    }
  };

  const handleProfileSave = async () => {
    if (!profileName.trim()) {
      alert("Name cannot be empty.");
      return;
    }
    if (!profilePhone.trim()) {
      alert("Phone number cannot be empty.");
      return;
    }
    
    // Validate phone format (7 to 15 digits)
    const cleanPhone = profilePhone.replace(/[-\s\(\)\.]/g, '');
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    if (!phoneRegex.test(cleanPhone)) {
      alert("Please enter a valid mobile phone number (7 to 15 digits).");
      return;
    }

    if (emergencyContact.trim()) {
      const cleanEmergency = emergencyContact.replace(/[-\s\(\)\.]/g, '');
      if (!phoneRegex.test(cleanEmergency)) {
        alert("Please enter a valid emergency contact phone number (7 to 15 digits).");
        return;
      }
    }

    setProfileSaving(true);
    try {
      // Direct Firestore write for profile details safely with merge: true
      await setDoc(doc(db, 'users', user.id), {
        name: profileName.trim(),
        phone: profilePhone.trim(),
        phoneNumber: profilePhone.trim(),
        emergencyContact: emergencyContact.trim(),
        avatar: profileAvatar,
        avatarUrl: profileAvatar,
        updatedAt: serverTimestamp()
      }, { merge: true });

      updatePhoneInSession(profilePhone.trim(), profileAvatar, profileName.trim());
      alert('Profile details updated successfully!');
      setShowProfileEdit(false);
    } catch (e) {
      console.error('Failed to update profile:', e);
      alert('Failed to update contact info: ' + e.message);
    } finally {
      setProfileSaving(false);
    }
  };

  // 2. Precise Geolocation coordinates watching (centralized realtime GPS)
  useEffect(() => {
    let watchId = null;
    
    const startWatching = () => {
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            console.log('[GPS] Realtime Customer Geolocation update:', lat, lng);
            
            let addrName = 'Detected Current Location';
            try {
              const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
              const data = await response.json();
              if (data && data.display_name) {
                addrName = data.display_name.split(',').slice(0, 3).join(',');
              }
            } catch (e) {
              console.error('OSM reverse geocode error:', e);
            }

            const detectedLoc = {
              name: addrName,
              latitude: lat,
              longitude: lng
            };
            
            setSelectedLocation(detectedLoc);
            
            // Sync with Firestore if active request exists
            if (activeJob && activeJob.id) {
              try {
                const requestRef = doc(db, 'requests', activeJob.id);
                await updateDoc(requestRef, {
                  pickupLatitude: lat,
                  pickupLongitude: lng,
                  customerLocation: {
                    lat,
                    lng,
                    updatedAt: new Date().toISOString()
                  }
                });
                console.log('[GPS] Synced customer live location to requests/{id}:', activeJob.id);
              } catch (err) {
                console.error('[GPS] Failed to sync customer live location:', err);
              }
            }
          },
          (error) => {
            console.warn('[GPS] Geolocation watch permission denied or unavailable (Customer):', error.message);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    };

    startWatching();

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [activeJob?.id]);



  const detectCurrentLocation = () => {
    // Retain function definition for backward-compatibility checks
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('[GPS] Current location checked.');
        },
        (error) => {}
      );
    }
  };

  useEffect(() => {
    fetchHistory();

    // 1. Subscribe to active request in real-time
    const unsubscribeActiveRequest = subscribeToActiveRequest(user.id, 'customer', (job) => {
      setActiveJob((prevJob) => {
        // Enforce instant real-time lifecycle synchronization (FINAL ISSUE 4 FIXED!)
        if (job) {
          // If the status has transitioned to accepted/en_route/arrived/in_progress/repairing/completed, 
          // instantly jump into the tracking state, regardless of whether the driver is on homepage or SOS view!
          const lowerStatus = job.status.toLowerCase();
          if (['accepted', 'en_route', 'arrived', 'in_progress', 'repairing', 'completed'].includes(lowerStatus)) {
            setViewState('tracking');
          }
        } else {
          // Job cleared or cancelled
          if (prevJob && !job) {
            fetchHistory();
            setViewState('homepage');
          }
        }
        return job;
      });
      setLoading(false);
    });

    // 2. Subscribe to online mechanics in real-time
    const unsubscribeOnlineMechanics = subscribeToOnlineMechanics((mechanicList) => {
      setNearby(mechanicList);
    });

    return () => {
      unsubscribeActiveRequest();
      unsubscribeOnlineMechanics();
    };
  }, [user.id]);

  // Live Chat Subscriptions (FINAL ISSUE 2 FIXED!)
  useEffect(() => {
    if (activeJob?.id && viewState === 'tracking') {
      const unsubscribeChat = subscribeToMessages(activeJob.id, (messages) => {
        setChatMessages(messages);
        // Scroll bottom on update
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
      await sendMessage(activeJob.id, user.id, user.name, 'customer', newMessage);
      setNewMessage('');
    } catch (e) {
      console.error('Failed to send live chat message:', e);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await getRequestHistory(user.id, 'customer');
      setHistory(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  // SOS Countdown trigger
  const triggerSOSCountdown = () => {
    setIsSOS(true);
    setSosCountdown(3);
  };

  useEffect(() => {
    if (sosCountdown > 0) {
      const timer = setTimeout(() => setSosCountdown(sosCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (sosCountdown === 0) {
      setSosCountdown(-1);
      setViewState('sos');
      executeSOSDirect();
    }
  }, [sosCountdown]);

  const executeSOSDirect = async () => {
    try {
      const payload = {
        customerId: user.id,
        customerName: user.name,
        customerPhone: user.phone || '',
        issueType: 'engine',
        description: '🚨 CRITICAL EMERGENCY SOS: Stranded Driver initiated high-priority emergency rescue alert from web.',
        pickupLatitude: selectedLocation.latitude,
        pickupLongitude: selectedLocation.longitude,
        pickupAddress: selectedLocation.name,
        estimatedCost: 1500,
        priority: 'emergency'
      };

      await createServiceRequest(payload);
      alert('🚨 SOS RESCUE SIGNAL ACTIVE! Dispatched high-priority emergency mechanical responder.');
    } catch (e) {
      alert('Failed to launch SOS emergency: ' + e.message);
    }
  };

  const handleRequestAssistance = async () => {
    setRequestLoading(true);
    try {
      const payload = {
        customerId: user.id,
        customerName: user.name,
        customerPhone: user.phone || '',
        issueType: selectedService.id,
        description: description || `Stranded driver needing immediate ${selectedService.label} roadside service`,
        pickupLatitude: selectedLocation.latitude,
        pickupLongitude: selectedLocation.longitude,
        pickupAddress: selectedLocation.name,
        estimatedCost: selectedService.cost,
        vehicleInfo: vehicleInfo || 'Unspecified Vehicle',
        mechanicId: selectedMechanic ? selectedMechanic.userId : null,
        mechanicName: selectedMechanic ? selectedMechanic.name : null,
        mechanicPhone: selectedMechanic ? selectedMechanic.phone : null,
        priority: 'normal'
      };

      await createServiceRequest(payload);
      setViewState('tracking');
      alert('Roadside rescue requested! Connecting to nearest mechanics.');
    } catch (e) {
      alert('Failed to request help: ' + e.message);
    } finally {
      setRequestLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!window.confirm('Are you sure you want to cancel your roadside assistance request?')) return;
    try {
      await cancelRequest(activeJob.id);
      setActiveJob(null);
      setViewState('homepage');
      fetchHistory();
      alert('Request cancelled successfully.');
    } catch (e) {
      alert('Failed to cancel request.');
    }
  };

  const handleRatingSubmit = async () => {
    if (!activeJob) return;
    const jobId = activeJob.id;
    const mechanicId = activeJob.mechanicId;

    let dbWritesSucceeded = false;
    try {
      await updateDoc(doc(db, 'requests', jobId), {
        status: 'reviewed',
        rating: userRating,
        ratingComment: reviewComment,
        reviewedAt: serverTimestamp(),
        driverAcknowledged: true
      });
      
      // Update mechanic's dynamic running rating strictly using only that mechanic's reviews
      if (mechanicId) {
        const mechRef = doc(db, 'mechanics', mechanicId);
        
        // Query all requests for this specific mechanic to calculate stats cleanly
        const q = query(
          collection(db, 'requests'),
          where('mechanicId', '==', mechanicId)
        );
        const qSnap = await getDocs(q);
        
        let totalReviewsCount = 0;
        let sumRatings = 0;
        let completedJobsCount = 0;
        
        qSnap.docs.forEach((docSnap) => {
          const reqData = docSnap.data();
          const statusLower = (reqData.status || '').toLowerCase();
          
          if (['completed', 'reviewed', 'closed'].includes(statusLower)) {
            completedJobsCount++;
          }
          
          let ratingValue = null;
          if (docSnap.id === jobId) {
            ratingValue = userRating;
          } else if (reqData.rating !== undefined && reqData.rating !== null) {
            ratingValue = reqData.rating;
          }
          
          if (ratingValue !== null) {
            totalReviewsCount++;
            sumRatings += ratingValue;
          }
        });
        
        // Safeguard: make sure we count current job if not fetched yet
        const hasCurrentJob = qSnap.docs.some(d => d.id === jobId);
        if (!hasCurrentJob) {
          totalReviewsCount++;
          sumRatings += userRating;
          completedJobsCount++;
        }
        
        const calculatedRating = totalReviewsCount > 0 
          ? parseFloat((sumRatings / totalReviewsCount).toFixed(2)) 
          : userRating;
          
        await setDoc(mechRef, { 
          rating: calculatedRating, 
          totalReviews: totalReviewsCount,
          jobsCompleted: completedJobsCount
        }, { merge: true });
      }

      dbWritesSucceeded = true;
    } catch (e) {
      console.error('Error submitting feedback rating database writes:', e);
      alert('Failed to submit review.');
      return;
    }

    // Wrap state updates in a separate try-catch block to prevent rendering or navigation issues from reporting failure
    try {
      alert('Review submitted successfully');
      setViewState('homepage');
      setActiveJob(null);
      fetchHistory();
    } catch (uiErr) {
      console.error('UI transition error after successful review submission:', uiErr);
    }
  };

  const handleSkipReview = async () => {
    try {
      if (activeJob && activeJob.id) {
        await updateDoc(doc(db, 'requests', activeJob.id), {
          status: 'reviewed',
          driverAcknowledged: true
        });
      }
    } catch (e) {
      console.error('Error skipping review:', e);
    }
    setViewState('homepage');
    setActiveJob(null);
    fetchHistory();
  };

  const handleSelectServiceCard = (serv) => {
    setSelectedService(serv);
    setIsSOS(false);
    setViewState('nearby_mechanics');
  };

  const handleSelectVehicle = (v) => {
    setSelectedVehicleId(v.id);
    setVehicleInfo(`${v.make} ${v.model} (${v.plateNumber})`);
  };

  const handleEndSOSMode = async () => {
    if (activeJob) {
      try {
        await cancelRequest(activeJob.id);
      } catch (e) {}
    }
    setActiveJob(null);
    setIsSOS(false);
    setViewState('homepage');
  };

  const handleSwitchToMechanic = async () => {
    if (!window.confirm("Are you sure you want to switch to the MECHANIC portal? This will update your profile role.")) return;
    try {
      await updateDoc(doc(db, 'users', user.id), { 
        role: 'mechanic',
        roles: ['mechanic']
      });
      
      // Ensure mechanic doc exists in mechanics collection
      const mechRef = doc(db, 'mechanics', user.id);
      const mechSnap = await getDoc(mechRef);
      if (!mechSnap.exists()) {
        await setDoc(mechRef, {
          userId: user.id,
          specialty: 'flat_tire',
          experienceYears: 5,
          rating: 0.0,
          totalReviews: 0,
          isOnline: true,
          isAvailable: true,
          latitude: 28.4595,
          longitude: 77.0266,
          lastLocationUpdate: serverTimestamp()
        }, { merge: true });
      }

      updateRoleInSession('mechanic');
      alert("Role switched to Mechanic! Loading your new dashboard...");
      navigate('/mechanic');
    } catch (e) {
      alert("Failed to switch role: " + e.message);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-dark text-white">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Syncing secure connection...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark text-white min-vh-100 pb-5" style={{ backgroundColor: '#000' }}>
      
      {/* SOS Countdown Overlay */}
      {sosCountdown >= 0 && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-danger bg-opacity-95 d-flex flex-column justify-content-center align-items-center" style={{ zIndex: 9999 }}>
          <i className="fa-solid fa-triangle-exclamation text-white display-1 mb-4 animate-bounce"></i>
          <h1 className="display-4 font-outfit fw-black text-white text-center px-3">TRIGGERING EMERGENCY SOS HELP</h1>
          <p className="lead text-white-50 text-center mb-5">Transmitting geolocations to nearby responder hubs in...</p>
          <div className="rounded-circle border border-white border-5 d-flex justify-content-center align-items-center text-white font-outfit fw-bold animate-pulse" style={{ width: '150px', height: '150px', fontSize: '5rem', backgroundColor: 'rgba(0,0,0,0.3)' }}>
            {sosCountdown}
          </div>
          <button className="btn btn-light btn-lg rounded-pill fw-bold px-5 mt-5 text-danger border-0 shadow" onClick={() => setSosCountdown(-1)}>
            Cancel SOS Rescue Alert
          </button>
        </div>
      )}

      {/* 1. HOMEPAGE VIEW */}
      {viewState === 'homepage' && (
        <>
          {/* Header Panel */}
          <section className="py-5 px-4 text-start" style={{
            background: 'linear-gradient(180deg, #1A1A1A 0%, #000000 100%)',
            borderBottomLeftRadius: '32px',
            borderBottomRightRadius: '32px'
          }}>
            <div className="container">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <span className="text-muted small">Welcome back,</span>
                  <h2 className="font-outfit fw-black text-white mb-0" style={{ fontSize: '2rem' }}>{user.name}</h2>
                  <button 
                    className="btn btn-link text-warning p-0 small text-decoration-none fw-bold mt-1" 
                    onClick={() => setViewState('profile')}
                    style={{ fontSize: '13px' }}
                  >
                    <i className="fa-solid fa-user-gear me-1"></i> My Profile & Settings
                  </button>
                </div>
                <div>
                  <img 
                    src={user.avatarUrl || user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=FFD700&color=000`} 
                    style={{ width: '48px', height: '48px', borderRadius: '24px', borderWidth: '2px', borderColor: '#FFD700', borderStyle: 'solid' }}
                    alt="Profile" 
                  />
                </div>
              </div>


              <div className="row g-3 align-items-center justify-content-between">
                <div className="col-md-7">
                  <div className="d-flex align-items-center gap-2" style={{ backgroundColor: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', padding: '12px 16px' }}>
                    <i className="fa-solid fa-location-dot text-danger"></i>
                    <select 
                      className="form-select bg-transparent border-0 text-white p-0 small" 
                      value={selectedLocation.name}
                      onChange={(e) => {
                        const loc = MOCK_LOCATIONS.find(l => l.name === e.target.value);
                        if (loc) setSelectedLocation(loc);
                      }}
                      style={{ outline: 'none', cursor: 'pointer', fontSize: '14px', boxShadow: 'none' }}
                    >
                      <option value={selectedLocation.name} className="bg-dark text-white">{selectedLocation.name}</option>
                      {MOCK_LOCATIONS.map((loc, idx) => {
                        if (loc.name === selectedLocation.name) return null;
                        return <option key={idx} value={loc.name} className="bg-dark text-white">{loc.name}</option>;
                      })}
                    </select>
                  </div>
                </div>
                <div className="col-md-4 text-md-end text-start">
                  <span className="badge px-3 py-2 rounded-pill font-outfit fw-bold tracking-wider fs-xs text-uppercase" style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)', color: '#FFD700', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
                    <i className="fa-solid fa-circle-check text-success me-1 animate-pulse"></i> {nearby.length} Mechanics Online
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Active Request Banner */}
          {activeJob && (
            <div className="container mt-4 text-start">
              <div className="alert bg-warning text-dark p-3 border-0 d-flex justify-content-between align-items-center mb-0 shadow-lg" style={{ borderRadius: '16px' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-dark rounded-circle d-flex justify-content-center align-items-center" style={{ width: '44px', height: '44px', color: '#FFD700' }}>
                    <i className="fa-solid fa-map-location-dot fs-5 animate-pulse"></i>
                  </div>
                  <div>
                    <strong className="d-block" style={{ fontSize: '15px' }}>Active Roadside Rescue Ticket</strong>
                    <small style={{ fontSize: '11px' }}>Status: {activeJob.status.replace('_', ' ').toUpperCase()}</small>
                  </div>
                </div>
                <button className="btn btn-dark btn-sm rounded-pill px-4 fw-bold" onClick={() => setViewState(activeJob.issueType === 'engine' && activeJob.description?.includes('SOS') ? 'sos' : 'tracking')}>
                  Track Live <i className="fa-solid fa-chevron-right ms-1"></i>
                </button>
              </div>
            </div>
          )}

          {/* Core Dashboard UI */}
          <div className="container mt-4 px-3">
            <div className="row g-4 text-start">
              
              {/* SOS Emergency Card */}
              <div className="col-12 mt-2">
                <div 
                  className="sos-card overflow-hidden transition-all text-white border-0" 
                  onClick={triggerSOSCountdown}
                  style={{ 
                    borderRadius: '20px', 
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #FF1744 0%, #B71C1C 100%)',
                    boxShadow: '0 8px 30px rgba(255, 23, 68, 0.3)'
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between p-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-3 rounded-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: '56px', height: '56px' }}>
                        <i className="fa-solid fa-triangle-exclamation fs-3"></i>
                      </div>
                      <div>
                        <h4 className="font-outfit fw-black mb-1">Emergency SOS</h4>
                        <p className="small mb-0 text-white-50">Immediate assistance at your current location</p>
                      </div>
                    </div>
                    <i className="fa-solid fa-chevron-right text-white-50 fs-5 pe-2"></i>
                  </div>
                </div>
              </div>

              {/* Service Selection Grid */}
              <div className="col-12">
                <div className="glass-card p-4" style={{ backgroundColor: 'rgba(20,20,20,0.7)', border: '1px solid #2a2a2a', borderRadius: '24px' }}>
                  <h4 className="font-outfit fw-bold text-white mb-3"><i className="fa-solid fa-screwdriver-wrench text-warning me-2"></i> Required Services</h4>
                  
                  <div className="row g-3">
                    {SERVICES.map((serv) => (
                      <div className="col-md-4 col-6" key={serv.id}>
                        <button 
                          type="button"
                          className="w-100 p-4 rounded-4 text-start border border-secondary border-opacity-10 bg-dark bg-opacity-50 text-muted transition-all d-flex flex-column gap-3 service-item-card"
                          onClick={() => handleSelectServiceCard(serv)}
                          style={{ minHeight: '130px', borderRadius: '20px', cursor: 'pointer' }}
                        >
                          <div className="p-2.5 rounded-3 d-inline-flex justify-content-center align-items-center" style={{ backgroundColor: serv.color + '15', width: '45px', height: '45px' }}>
                            <i className={`${serv.icon} fs-4`} style={{ color: serv.color }}></i>
                          </div>
                          <div>
                            <div className="fw-bold font-outfit text-white" style={{ fontSize: '14px' }}>{serv.label}</div>
                            <small className="text-muted d-block mt-0.5">Est: ₹{serv.cost}</small>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick stats/recent activity */}
              <div className="col-12 mb-2">
                <div className="glass-card p-4" style={{ backgroundColor: 'rgba(20,20,20,0.7)', border: '1px solid #2a2a2a', borderRadius: '24px' }}>
                  <h5 className="font-outfit fw-bold text-white mb-3"><i className="fa-solid fa-chart-line text-warning me-2"></i> Your Activity</h5>
                  <div className="row g-3 text-center">
                    <div className="col-md-3 col-6" style={{ cursor: 'pointer' }} onClick={() => {
                      const activityLog = document.getElementById('recent-activity-log');
                      if (activityLog) {
                        activityLog.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}>
                      <div className="p-3 bg-dark bg-opacity-70 rounded-3 border border-secondary border-opacity-15 hover-scale transition-all">
                        <h4 className="fw-bold text-warning mb-0">{history.length}</h4>
                        <small className="text-muted small">History</small>
                      </div>
                    </div>
                    <div className="col-md-3 col-6" style={{ cursor: 'pointer' }} onClick={() => setInfoModalContent({
                      title: 'Membership Tier',
                      body: [`Your current plan is: ${membershipTier}`, 'Enjoy premium benefits like priority mechanic dispatch, unlimited emergency SOS triggers, and zero platform dispatch service fees.'],
                      icon: 'fa-id-card text-warning'
                    })}>
                      <div className="p-3 bg-dark bg-opacity-70 rounded-3 border border-secondary border-opacity-15 hover-scale transition-all">
                        <h4 className="fw-bold text-warning mb-0">{membershipTier}</h4>
                        <small className="text-muted small">Membership</small>
                      </div>
                    </div>
                    <div className="col-md-3 col-6" style={{ cursor: 'pointer' }} onClick={() => setViewState('profile_contacts')}>
                      <div className="p-3 bg-dark bg-opacity-70 rounded-3 border border-secondary border-opacity-15 hover-scale transition-all">
                        <h4 className="fw-bold text-warning mb-0">{emergencyContacts.length} Saved</h4>
                        <small className="text-muted small">Contacts</small>
                      </div>
                    </div>
                    <div className="col-md-3 col-6" style={{ cursor: 'pointer' }} onClick={() => setInfoModalContent({
                      title: 'Support Desk',
                      body: ['Our operations rescue control center is online 24/7.', 'For urgent assistance, dial emergency helpline 112 or trigger the SOS beacon.', 'Email contact support: nandunandivardhan7@gmail.com'],
                      icon: 'fa-headset text-warning'
                    })}>
                      <div className="p-3 bg-dark bg-opacity-70 rounded-3 border border-secondary border-opacity-15 hover-scale transition-all">
                        <h4 className="fw-bold text-warning mb-0">24/7</h4>
                        <small className="text-muted small">Support</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Past Completed Requests History List */}
              <div className="col-12 mb-4">
                <div className="glass-card p-4" style={{ backgroundColor: 'rgba(20,20,20,0.7)', border: '1px solid #2a2a2a', borderRadius: '24px' }}>
                  <h4 className="font-outfit fw-bold text-white mb-3">
                    <i className="fa-solid fa-clock-rotate-left text-warning me-2"></i> Recent Activity Log
                  </h4>

                  {history.length === 0 ? (
                    <div className="text-center py-4 text-muted small">
                      No past roadside rescue transactions found in your account.
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3 overflow-auto" style={{ maxHeight: '350px' }}>
                      {history.map((item) => {
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
                                <h6 className="mb-0 font-outfit text-white fw-bold">{sInfo.label} Rescue {item.priority === 'emergency' && <span className="badge bg-danger text-white fs-xxs ms-1">SOS</span>}</h6>
                                <small className="text-muted d-block mt-0.5" style={{ fontSize: '11.5px' }}>
                                  Date/Time: <strong>{dt}</strong> • Rescue Pro: <strong>{item.mechanicName || 'General Dispatch'}</strong> • Customer: <strong>{item.customerName || user.name}</strong>
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
                              <span className="fw-bold text-white d-block">₹{(() => {
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
                               })()}</span>
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

              {/* Sign out */}
              <div className="col-12 text-center mt-2">
                <button 
                  className="btn btn-outline-danger btn-lg w-100 py-3 fw-bold rounded-3 border border-danger border-opacity-35" 
                  onClick={logoutUser}
                  style={{ borderRadius: '16px' }}
                >
                  <i className="fa-solid fa-sign-out me-2"></i> Sign Out from RoadRescue
                </button>
              </div>

            </div>
          </div>
        </>
      )}

      {/* 2. NEARBY MECHANICS SCANNER VIEW */}
      {viewState === 'nearby_mechanics' && (
        <div className="container mt-4 px-3 text-start">
          
          {/* Header */}
          <div className="d-flex align-items-center gap-3 mb-4">
            <button className="btn btn-outline-warning btn-sm rounded-pill px-3" onClick={() => setViewState('homepage')} style={{ borderColor: 'rgba(255,215,0,0.3)', color: '#FFD700' }}>
              <i className="fa-solid fa-arrow-left me-2"></i> Back
            </button>
            <div>
              <h3 className="font-outfit fw-bold text-white mb-0">{selectedService.label} Discovery</h3>
              <p className="small text-muted mb-0">Scanning active mechanic shops in a 25km radius...</p>
            </div>
          </div>

          <div className="row g-4">
            {/* Left Column: Map */}
            <div className="col-lg-7">
              <div className="glass-card p-3" style={{ height: '450px', backgroundColor: 'rgba(20,20,20,0.7)', border: '1px solid #2a2a2a', borderRadius: '24px' }}>
                <RoadRescueMap 
                  customerLocation={{ latitude: selectedLocation.latitude, longitude: selectedLocation.longitude }}
                  nearbyMechanics={nearby}
                  zoom={13}
                />
              </div>
            </div>

            {/* Right Column: Mechanics List */}
            <div className="col-lg-5">
              <div className="glass-card p-4 d-flex flex-column justify-content-between h-100" style={{ backgroundColor: 'rgba(20,20,20,0.7)', border: '1px solid #2a2a2a', borderRadius: '24px', minHeight: '450px' }}>
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="font-outfit fw-bold text-white mb-0">Available Pros ({nearby.length})</h5>
                    <button className="btn btn-dark btn-sm rounded" onClick={detectCurrentLocation} style={{ border: '1px solid #333' }}>
                      <i className="fa-solid fa-refresh"></i>
                    </button>
                  </div>

                  <div className="overflow-auto pr-1" style={{ maxHeight: '280px' }}>
                    {nearby.length === 0 ? (
                      <div className="text-center py-4 border border-secondary border-opacity-15 rounded-3 bg-dark bg-opacity-30">
                        <i className="fa-solid fa-satellite-dish text-muted fs-2 mb-2 animate-pulse"></i>
                        <p className="small text-muted mb-0 px-2">No custom mechanics online in this region. You can still dispatch the RoadRescue general expert responder partner.</p>
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {nearby.map((mech) => (
                          <div 
                            key={mech.id} 
                            onClick={() => setSelectedMechanic(mech)}
                            style={{ 
                              borderRadius: '16px', 
                              cursor: 'pointer',
                              border: selectedMechanic?.id === mech.id ? '2px solid #FFD700' : '1px solid #2d2d2d',
                              backgroundColor: selectedMechanic?.id === mech.id ? 'rgba(255, 215, 0, 0.05)' : 'rgba(0,0,0,0.3)',
                              transition: 'all 0.2s ease'
                            }}
                            className="p-3 d-flex align-items-center justify-content-between"
                          >
                            <div className="d-flex align-items-center gap-3">
                              <div className="p-2 rounded-3 text-center d-flex align-items-center justify-content-center" style={{ backgroundColor: mech.rating >= 4.9 ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.05)', width: '42px', height: '42px' }}>
                                <i className="fa-solid fa-shield-halved" style={{ color: mech.rating >= 4.9 ? '#FFD700' : '#888' }}></i>
                              </div>
                              <div>
                                <h6 className="mb-0 font-outfit text-white fw-bold">
                                  {mech.name} 
                                  {mech.verified && <i className="fas fa-certificate text-info ms-1.5" title="Verified Professional" style={{ fontSize: '12px' }}></i>}
                                  {mech.rating >= 4.9 && <span className="badge bg-warning text-dark font-outfit fw-black fs-xxs ms-1">PRO</span>}
                                </h6>
                                <span className="small text-muted d-block">{mech.specialty?.replace('_', ' ').toUpperCase()} • {mech.experienceYears} Years Exp</span>
                                <div className="d-flex align-items-center gap-1 mt-1 small">
                                  <i className="fa-solid fa-star text-warning small"></i>
                                  <span className="text-white-50">{mech.rating}</span>
                                  <span className="text-success small ms-2">• Online</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-warning">
                              {selectedMechanic?.id === mech.id ? <i className="fa-solid fa-circle-check fs-5 animate-pulse"></i> : <i className="fa-solid fa-circle-notch text-muted fs-6"></i>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-top border-secondary border-opacity-15">
                  <button 
                    className="btn btn-warning py-3 w-100 fw-bold font-outfit text-dark rounded-3 shadow-lg transition-all"
                    onClick={() => setViewState('request_help')}
                    style={{
                      background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                      border: 'none',
                      borderRadius: '12px'
                    }}
                  >
                    Request On-Site Help <i className="fa-solid fa-car-wrench ms-1"></i>
                  </button>
                  <p className="text-center text-muted small mt-2 mb-0">A RoadRescue partner will arrive in 15-30 mins</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 3. REQUEST DETAILS / CUSTOM VEHICLE INPUT VIEW */}
      {viewState === 'request_help' && (
        <div className="container mt-4 px-3 text-start" style={{ maxWidth: '800px' }}>
          
          {/* Header */}
          <div className="d-flex align-items-center gap-3 mb-4">
            <button className="btn btn-outline-warning btn-sm rounded-pill px-3" onClick={() => setViewState('nearby_mechanics')} style={{ borderColor: 'rgba(255,215,0,0.3)', color: '#FFD700' }}>
              <i className="fa-solid fa-arrow-left me-2"></i> Back
            </button>
            <h3 className="font-outfit fw-bold text-white mb-0">Request Help</h3>
          </div>

          <div className="glass-card p-4" style={{ backgroundColor: 'rgba(20,20,20,0.7)', border: '1px solid #2a2a2a', borderRadius: '24px' }}>
            {/* Selected Issue summary card */}
            <div className="p-3 bg-dark bg-opacity-70 rounded-3 border border-secondary border-opacity-15 mb-4 d-flex align-items-center gap-3">
              <div className="p-3 rounded-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: selectedService.color + '15', width: '56px', height: '56px' }}>
                <i className={`${selectedService.icon} fs-3`} style={{ color: selectedService.color }}></i>
              </div>
              <div>
                <h5 className="font-outfit fw-bold text-white mb-0">{selectedService.label} Assistance</h5>
                <small className="text-muted d-block mt-0.5"><i className="fa-solid fa-map-pin text-danger me-1"></i> {selectedLocation.name}</small>
              </div>
            </div>

            {/* Select Vehicle section */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="fw-bold font-outfit text-white small">Select Vehicle</span>
                <span className="text-warning small" style={{ cursor: 'pointer' }} onClick={() => setViewState('profile_vehicles')}>Manage Garage</span>
              </div>

              <div className="row g-2 mb-3">
                {vehicles.length === 0 ? (
                  <div className="col-12 text-center text-muted small p-3 border border-secondary border-opacity-10 rounded-3">
                    No vehicles saved in your profile yet. Add a vehicle in your profile settings or enter vehicle details manually below.
                  </div>
                ) : (
                  vehicles.map((v) => (
                    <div className="col-md-6" key={v.id}>
                      <button 
                        type="button"
                        className={`w-100 p-3 text-start rounded-3 border transition-all ${selectedVehicleId === v.id ? 'border-warning bg-warning bg-opacity-10 text-white fw-bold' : 'border-secondary border-opacity-20 bg-dark bg-opacity-50 text-muted'}`}
                        onClick={() => handleSelectVehicle(v)}
                        style={{ borderRadius: '12px' }}
                      >
                        <i className="fa-solid fa-car me-2 text-warning"></i> {v.year} {v.make} {v.model} ({v.plateNumber})
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="mb-3">
                <label className="form-label text-muted small fw-semibold">Or enter vehicle details manually</label>
                <input 
                  type="text" 
                  className="form-control bg-dark border-secondary border-opacity-35 text-white" 
                  placeholder="e.g. Honda City 2022 White"
                  value={vehicleInfo}
                  onChange={(e) => {
                    setSelectedVehicleId(null);
                    setVehicleInfo(e.target.value);
                  }}
                  style={{ borderRadius: '12px', border: '1px solid #333' }}
                />
              </div>

              <div className="mb-4">
                <label className="form-label text-muted small fw-semibold">Describe the Roadside Issue (Optional)</label>
                <textarea 
                  className="form-control bg-dark border-secondary border-opacity-35 text-white" 
                  rows="3" 
                  placeholder="e.g. Flat tire on front driver side, no spare available..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ borderRadius: '12px', border: '1px solid #333' }}
                ></textarea>
              </div>
            </div>

            {/* Cost Breakdown Card */}
            <div className="p-3 bg-dark bg-opacity-50 border border-secondary border-opacity-15 rounded-3 mb-4 text-start">
              <div className="fw-bold font-outfit text-white mb-2 fs-xs">Estimated Cost Breakdown</div>
              <div className="d-flex justify-content-between small mb-1">
                <span className="text-muted">Base Service Charge:</span>
                <span className="fw-bold text-white">₹{selectedService.cost}</span>
              </div>
              <div className="d-flex justify-content-between small mb-1">
                <span className="text-muted">Distance Surcharge:</span>
                <span className="fw-bold text-white">₹50</span>
              </div>
              <hr className="border-secondary border-opacity-30 my-2" />
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold text-white">Total Estimate:</span>
                <span className="fw-black text-warning fs-5">₹{selectedService.cost + 50}</span>
              </div>
            </div>

            {/* Submit button */}
            <div className="d-grid mt-4">
              <button 
                className="btn btn-warning py-3 fw-bold font-outfit text-dark rounded-3 shadow-lg transition-all"
                onClick={handleRequestAssistance}
                disabled={requestLoading || !vehicleInfo}
                style={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  border: 'none',
                  borderRadius: '12px'
                }}
              >
                {requestLoading ? (
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                ) : (
                  <>Confirm & Request Mechanic <i className="fa-solid fa-chevron-right ms-1"></i></>
                )}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* 4. ACTIVE SOS EMERGENCY VIEW */}
      {viewState === 'sos' && (
        <div className="container mt-4 px-3 text-start" style={{ maxWidth: '600px' }}>
          
          <div className="text-center py-4 bg-danger rounded-4 mb-4 shadow" style={{ background: 'linear-gradient(135deg, #FF1744 0%, #B71C1C 100%)' }}>
            <i className="fa-solid fa-triangle-exclamation text-white display-4 animate-bounce mb-2"></i>
            <h2 className="font-outfit fw-black text-white mb-1">SOS ACTIVE</h2>
            <p className="small text-white-50 mb-0">Your emergency geolocations are actively broadcasting</p>
          </div>

          {/* Alarm mute control */}
          <div className="glass-card p-3 mb-4 d-flex justify-content-between align-items-center" style={{ backgroundColor: 'rgba(20,20,20,0.7)', border: '1px solid #2a2a2a', borderRadius: '20px' }}>
            <span className="fw-bold font-outfit text-white"><i className="fa-solid fa-volume-high text-danger me-2"></i> Simulated Siren Alarm</span>
            <button 
              className={`btn btn-sm px-4 fw-bold rounded-pill border-0 ${isAlarmPlaying ? 'btn-danger' : 'btn-dark bg-secondary'}`}
              onClick={() => setIsAlarmPlaying(!isAlarmPlaying)}
            >
              {isAlarmPlaying ? 'Mute Siren' : 'Enable Siren'}
            </button>
          </div>

          {/* Location share options */}
          <div className="mb-4">
            <span className="text-muted text-uppercase fw-bold fs-xxs d-block mb-2">Simulate Share Coordinates</span>
            <div className="row g-2">
              <div className="col-6">
                <button className="btn btn-light w-100 py-3 rounded-3 text-dark fw-bold" onClick={() => alert('Simulating emergency SMS to saved contacts.')}>
                  <i className="fa-solid fa-message-sms text-danger me-2"></i> SMS Contacts
                </button>
              </div>
              <div className="col-6">
                <button className="btn btn-light w-100 py-3 rounded-3 text-dark fw-bold" onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent('🚨 EMERGENCY ROAD RESCUE OUTLET INITIATED! Live tracking: https://maps.google.com/?q=' + selectedLocation.latitude + ',' + selectedLocation.longitude)}`)}>
                  <i className="fa-brands fa-whatsapp text-success me-2"></i> WhatsApp
                </button>
              </div>
            </div>
          </div>

          {/* Emergency Call Numbers */}
          <div className="mb-4">
            <span className="text-muted text-uppercase fw-bold fs-xxs d-block mb-2">Emergency Services Hub</span>
            
            <a href="tel:112" className="text-decoration-none d-flex align-items-center bg-danger bg-opacity-70 p-3 rounded-3 mb-2 justify-content-between text-white border border-danger border-opacity-30">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-dark bg-opacity-50 p-2 rounded-circle" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-phone"></i></div>
                <div>
                  <h6 className="mb-0 font-outfit fw-bold">Call 112</h6>
                  <small className="text-white-50">National Assistance Hub</small>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right text-white-50"></i>
            </a>

            <a href="tel:100" className="text-decoration-none d-flex align-items-center bg-primary bg-opacity-70 p-3 rounded-3 mb-2 justify-content-between text-white border border-primary border-opacity-30">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-dark bg-opacity-50 p-2 rounded-circle" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-phone"></i></div>
                <div>
                  <h6 className="mb-0 font-outfit fw-bold">Call 100</h6>
                  <small className="text-white-50">Highway Patrol Dispatch</small>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right text-white-50"></i>
            </a>

            <a href="tel:108" className="text-decoration-none d-flex align-items-center bg-success bg-opacity-70 p-3 rounded-3 mb-2 justify-content-between text-white border border-success border-opacity-30">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-dark bg-opacity-50 p-2 rounded-circle" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-phone"></i></div>
                <div>
                  <h6 className="mb-0 font-outfit fw-bold">Call 108</h6>
                  <small className="text-white-50">Emergency Ambulance Route</small>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right text-white-50"></i>
            </a>
          </div>

          {/* End Emergency Button */}
          <div className="d-grid mt-4">
            <button className="btn btn-light py-3 text-danger fw-bold rounded-3 shadow" onClick={handleEndSOSMode} style={{ borderRadius: '12px' }}>
              <i className="fa-solid fa-close me-2"></i> END EMERGENCY SOS
            </button>
          </div>

        </div>
      )}

      {/* 5. ACTIVE REQUEST LIVE TRACKING VIEW */}
      {viewState === 'tracking' && activeJob && (
        <div className="container mt-4 px-3 text-start">
          
          {/* Header */}
          <div className="col-12 mb-3">
            <button className="btn btn-outline-warning btn-sm rounded-pill px-3" onClick={() => setViewState('homepage')} style={{ borderColor: 'rgba(255,215,0,0.3)', color: '#FFD700' }}>
              <i className="fa-solid fa-arrow-left me-2"></i> Return to Homepage
            </button>
          </div>

          <div className="row g-4">
            {/* Live Tracking Map */}
            <div className="col-lg-8">
              <div className="glass-card p-3" style={{ height: '500px', backgroundColor: 'rgba(20,20,20,0.7)', border: '1px solid #2a2a2a', borderRadius: '24px' }}>
                <RoadRescueMap 
                  customerLocation={{ latitude: activeJob.pickupLatitude, longitude: activeJob.pickupLongitude }}
                  mechanicLocation={activeJob.mechanicLatitude ? { latitude: activeJob.mechanicLatitude, longitude: activeJob.mechanicLongitude } : null}
                  customerAddress={activeJob.pickupAddress}
                  mechanicName={activeJob.mechanicName || 'Locating certified mechanic partner...'}
                  zoom={14}
                />
              </div>
            </div>

            {/* Active request metrics and controls */}
            <div className="col-lg-4">
              <div className="glass-card p-4 h-100 d-flex flex-column justify-content-between" style={{ backgroundColor: 'rgba(20,20,20,0.7)', border: '1px solid #2a2a2a', borderRadius: '24px', minHeight: '500px' }}>
                
                {/* Check if Job is Completed to render high-fidelity rating sheet */}
                {activeJob?.status?.toLowerCase() === 'completed' ? (
                  <div className="animate-fade-in">
                    <div className="text-center py-4 bg-success bg-opacity-10 border border-success border-opacity-20 rounded-3 mb-4">
                      <div className="rounded-circle bg-success bg-opacity-15 d-inline-flex justify-content-center align-items-center mb-3" style={{ width: '64px', height: '64px', color: '#4CAF50' }}>
                        <i className="fa-solid fa-circle-check fs-2 animate-pulse"></i>
                      </div>
                      <h4 className="font-outfit fw-black text-white mb-1">Job Completed!</h4>
                      <p className="small text-muted px-3 mb-0">How was your service with {activeJob?.mechanicName || 'our certified partner'}?</p>
                    </div>

                    <div className="mb-4">
                      <label className="form-label text-muted small fw-semibold d-block text-center">Your Rating</label>
                      <div className="d-flex justify-content-center gap-3 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star} 
                            type="button" 
                            className="btn btn-link p-0 text-decoration-none transition-all"
                            onClick={() => setUserRating(star)}
                          >
                            <i className={`${star <= userRating ? 'fa-solid' : 'fa-regular'} fa-star text-warning`} style={{ fontSize: '2.4rem' }}></i>
                          </button>
                        ))}
                      </div>

                      <div className="mb-3">
                        <label className="form-label text-muted small fw-semibold">Leave a comment (optional)</label>
                        <textarea 
                          className="form-control bg-dark border-secondary border-opacity-35 text-white" 
                          rows="3" 
                          placeholder="Tell us about the service quality..."
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          style={{ borderRadius: '12px', border: '1px solid #333' }}
                        ></textarea>
                      </div>
                    </div>

                    <div className="d-grid gap-2">
                      <button 
                        className="btn btn-warning py-3 fw-bold font-outfit text-dark rounded-3 shadow"
                        onClick={handleRatingSubmit}
                        style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', border: 'none', borderRadius: '12px' }}
                      >
                        Submit Review & Close <i className="fa-solid fa-send ms-1"></i>
                      </button>
                      <button 
                        className="btn btn-link text-muted small mt-2 text-decoration-none"
                        onClick={handleSkipReview}
                      >
                        Skip review for now
                      </button>
                    </div>
                  </div>
                ) : (
                  // Regular live tracking sheet
                  <div className="d-flex flex-column justify-content-between h-100">
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="badge bg-warning text-dark fw-bold">Roadside Rescue Assigned</span>
                        <span className={`status-badge-custom ${activeJob?.status?.toLowerCase() || 'pending'}`}>
                          {activeJob?.status?.replace('_', ' ')?.toUpperCase() || 'PENDING'}
                        </span>
                      </div>

                      <h3 className="font-outfit fw-black text-white mb-2">
                        {SERVICES.find(s => s.id === activeJob?.issueType)?.label || activeJob?.issueType?.replace('_', ' ')?.toUpperCase() || 'RESCUE JOB'}
                      </h3>
                      <p className="small text-muted mb-3">{activeJob?.description}</p>
                      
                      {/* Mechanic Info Card with Click to Call Support (FINAL ISSUE 3 FIXED!) */}
                      {activeJob?.mechanicName && (
                        <div className="p-3 bg-dark bg-opacity-50 border border-secondary border-opacity-15 rounded-3 mb-3 d-flex align-items-center justify-content-between">
                          <div>
                            <h6 className="mb-0 font-outfit text-white fw-bold">
                              {activeJob?.mechanicName}
                              {mechanicVerified && (
                                <i className="fas fa-certificate text-info ms-2" title="Verified Professional"></i>
                              )}
                            </h6>
                            <small className="text-muted d-block" style={{ fontSize: '11px' }}><i className="fa-solid fa-wrench text-warning me-1"></i> Certified Rescue Partner</small>
                          </div>
                          <a href={`tel:${mechanicLatestPhone || activeJob?.mechanicPhone || ''}`} className="btn btn-outline-success btn-sm rounded-pill px-3 fw-bold">
                            <i className="fa-solid fa-phone me-1"></i> Call Mechanic
                          </a>
                        </div>
                      )}

                      <hr className="border-secondary border-opacity-30" />

                      {/* Progressive Steps */}
                      <div className="position-relative py-2 text-start mb-3">
                        <div className="mb-3 d-flex align-items-center gap-3">
                          <div className={`rounded-circle d-flex justify-content-center align-items-center ${['pending', 'accepted', 'en_route', 'arrived', 'in_progress', 'completed'].includes(activeJob?.status?.toLowerCase() || 'pending') ? 'bg-warning text-dark fw-bold' : 'bg-secondary text-muted'}`} style={{ width: '28px', height: '28px' }}>
                            {activeJob?.status?.toLowerCase() === 'pending' ? <span className="spinner-border spinner-border-sm" style={{ width: '10px', height: '10px', borderWidth: '2px' }}></span> : <i className="fas fa-check fs-xs" style={{ fontSize: '11px' }}></i>}
                          </div>
                          <div>
                            <div className="fw-bold fs-xs" style={{ fontSize: '13px' }}>Assistance Request Raised</div>
                          </div>
                        </div>

                        <div className="mb-3 d-flex align-items-center gap-3">
                          <div className={`rounded-circle d-flex justify-content-center align-items-center ${['accepted', 'en_route', 'arrived', 'in_progress', 'repairing', 'completed'].includes(activeJob?.status?.toLowerCase() || '') ? 'bg-warning text-dark fw-bold' : 'bg-secondary text-muted'}`} style={{ width: '28px', height: '28px' }}>
                            {activeJob?.status?.toLowerCase() === 'accepted' ? <span className="spinner-border spinner-border-sm" style={{ width: '10px', height: '10px', borderWidth: '2px' }}></span> : <i className="fas fa-check fs-xs" style={{ fontSize: '11px' }}></i>}
                          </div>
                          <div>
                            <div className="fw-bold fs-xs" style={{ fontSize: '13px' }}>Job Accepted & En-Route</div>
                          </div>
                        </div>

                        <div className="mb-3 d-flex align-items-center gap-3">
                          <div className={`rounded-circle d-flex justify-content-center align-items-center ${['arrived', 'in_progress', 'repairing', 'completed'].includes(activeJob?.status?.toLowerCase() || '') ? 'bg-warning text-dark fw-bold' : 'bg-secondary text-muted'}`} style={{ width: '28px', height: '28px' }}>
                            {['arrived', 'in_progress', 'repairing'].includes(activeJob?.status?.toLowerCase() || '') ? <span className="spinner-border spinner-border-sm" style={{ width: '10px', height: '10px', borderWidth: '2px' }}></span> : <i className="fas fa-check fs-xs" style={{ fontSize: '11px' }}></i>}
                          </div>
                          <div>
                            <div className="fw-bold fs-xs" style={{ fontSize: '13px' }}>Repairs In Progress</div>
                          </div>
                        </div>
                      </div>

                      {/* Real-time Live Chat Widget (FINAL ISSUE 2 FIXED!) */}
                      {activeJob?.mechanicName && (
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

                    <div className="d-grid gap-2 mt-auto">
                      <button 
                        className="btn btn-outline-danger py-2 rounded-3 fw-bold" 
                        onClick={handleCancelRequest}
                        disabled={['completed', 'cancelled', 'in_progress', 'repairing'].includes(activeJob?.status?.toLowerCase() || '')}
                      >
                        <i className="fas fa-ban me-2"></i> Cancel Assistance Request
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

        </div>
      )}

      {viewState === 'profile' && (
        <div className="container mt-4 px-3 text-start animate-fade-in" style={{ maxWidth: '600px' }}>
          {/* Header */}
          <div className="d-flex align-items-center gap-3 mb-4">
            <button className="btn btn-outline-warning btn-sm rounded-pill px-3" onClick={() => {
              if (showProfileEdit) {
                setShowProfileEdit(false);
              } else {
                setViewState('homepage');
              }
            }} style={{ borderColor: 'rgba(255,215,0,0.3)', color: '#FFD700' }}>
              <i className="fa-solid fa-arrow-left me-2"></i> Back
            </button>
            <h3 className="font-outfit fw-bold text-white mb-0">{showProfileEdit ? "Edit Profile" : "My Profile"}</h3>
          </div>

          {showProfileEdit ? (
            /* Dedicated Profile Editor Form Section */
            <div className="p-4 glass-card mb-4" style={{ backgroundColor: 'rgba(20, 20, 20, 0.7)', border: '1px solid #2a2a2a', borderRadius: '24px' }}>
              <h5 className="font-outfit fw-bold text-white mb-4"><i className="fa-solid fa-user-gear text-warning me-2"></i> Update Contact Details</h5>
              <div className="row g-3">
                <div className="col-12 text-start">
                  <label className="form-label text-muted small fw-semibold">Full Name</label>
                  <div className="input-group" style={{ backgroundColor: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' }}>
                    <span className="input-group-text bg-transparent border-0 text-muted ps-3">
                      <i className="fa-solid fa-user"></i>
                    </span>
                    <input 
                      type="text" 
                      className="form-control bg-transparent border-0 text-white py-2.5 ps-1" 
                      placeholder="Your Full Name"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      style={{ outline: 'none', boxShadow: 'none' }}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6 text-start">
                  <label className="form-label text-muted small fw-semibold">Mobile Phone Number</label>
                  <div className="input-group" style={{ backgroundColor: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' }}>
                    <span className="input-group-text bg-transparent border-0 text-muted ps-3">
                      <i className="fa-solid fa-phone"></i>
                    </span>
                    <input 
                      type="tel" 
                      className="form-control bg-transparent border-0 text-white py-2.5 ps-1" 
                      placeholder="+91 9876543210"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      style={{ outline: 'none', boxShadow: 'none' }}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6 text-start">
                  <label className="form-label text-muted small fw-semibold">Emergency SOS Contact (Optional)</label>
                  <div className="input-group" style={{ backgroundColor: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' }}>
                    <span className="input-group-text bg-transparent border-0 text-muted ps-3">
                      <i className="fa-solid fa-heart-pulse"></i>
                    </span>
                    <input 
                      type="tel" 
                      className="form-control bg-transparent border-0 text-white py-2.5 ps-1" 
                      placeholder="Emergency SOS Contact"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      style={{ outline: 'none', boxShadow: 'none' }}
                    />
                  </div>
                </div>
              </div>
              <div className="col-12 mt-4 text-start">
                <label className="form-label text-muted small fw-semibold">Profile Photo / Custom Avatar</label>
                <div className="d-flex align-items-center gap-3">
                  <img 
                    src={profileAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileName || user.name)}&background=FFD700&color=000`} 
                    style={{ width: '56px', height: '56px', borderRadius: '28px', border: '2px solid #FFD700', objectFit: 'cover' }}
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
              <div className="d-flex gap-2 mt-4">
                <button 
                  className="btn btn-warning px-4 py-2.5 fw-bold"
                  onClick={handleProfileSave}
                  disabled={profileSaving || !profilePhone.trim() || !profileName.trim()}
                  style={{ borderRadius: '12px' }}
                >
                  {profileSaving ? <span className="spinner-border spinner-border-sm"></span> : "Save Changes"}
                </button>
                <button 
                  className="btn btn-secondary px-4 py-2.5"
                  onClick={() => setShowProfileEdit(false)}
                  style={{ borderRadius: '12px' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center py-4 rounded-4 mb-4 shadow position-relative" style={{ background: 'linear-gradient(180deg, #1A1A1A 0%, #000000 100%)', border: '1px solid #333' }}>
                <div className="d-inline-block position-relative mb-3">
                  <img 
                    src={profileAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=FFD700&color=000`} 
                    style={{ width: '100px', height: '100px', borderRadius: '50px', objectFit: 'cover', border: '3px solid #FFD700' }}
                    alt="Avatar"
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=FFD700&color=000` }}
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
                <h4 className="font-outfit fw-black text-white mb-1">{user.name}</h4>
                <p className="small text-muted mb-0">{user.email}</p>
                <span className="badge bg-warning bg-opacity-10 text-warning mt-2 px-3 py-1.5 rounded-pill font-outfit" style={{ border: '1px solid rgba(255,215,0,0.2)' }}>
                  🚗 Customer
                </span>
              </div>

              {/* Profile Menu Items */}
              <div className="glass-card overflow-hidden mb-4" style={{ backgroundColor: 'rgba(20,20,20,0.7)', border: '1px solid #2a2a2a', borderRadius: '24px' }}>
                <div className="list-group list-group-flush bg-transparent">
                  <button className="list-group-item list-group-item-action bg-transparent border-secondary border-opacity-10 text-white d-flex align-items-center justify-content-between p-3" onClick={() => setShowProfileEdit(true)}>
                    <span className="d-flex align-items-center"><i className="fa-solid fa-user-edit text-muted me-3 fs-5" style={{ width: '24px' }}></i> Edit Profile</span>
                    <i className="fa-solid fa-chevron-right text-muted small"></i>
                  </button>
                  <button className="list-group-item list-group-item-action bg-transparent border-secondary border-opacity-10 text-white d-flex align-items-center justify-content-between p-3" onClick={() => setViewState('profile_vehicles')}>
                    <span className="d-flex align-items-center"><i className="fa-solid fa-car text-muted me-3 fs-5" style={{ width: '24px' }}></i> My Vehicles</span>
                    <i className="fa-solid fa-chevron-right text-muted small"></i>
                  </button>
                  <button className="list-group-item list-group-item-action bg-transparent border-secondary border-opacity-10 text-white d-flex align-items-center justify-content-between p-3" onClick={() => setViewState('profile_contacts')}>
                    <span className="d-flex align-items-center"><i className="fa-solid fa-shield-heart text-muted me-3 fs-5" style={{ width: '24px' }}></i> Emergency Contacts</span>
                    <i className="fa-solid fa-chevron-right text-muted small"></i>
                  </button>
                  <button className="list-group-item list-group-item-action bg-transparent border-secondary border-opacity-10 text-white d-flex align-items-center justify-content-between p-3" onClick={handleSwitchToMechanic}>
                    <span className="d-flex align-items-center"><i className="fa-solid fa-rotate text-muted me-3 fs-5" style={{ width: '24px' }}></i> Switch to Mechanic</span>
                    <i className="fa-solid fa-chevron-right text-muted small"></i>
                  </button>
                  <button className="list-group-item list-group-item-action bg-transparent border-secondary border-opacity-10 text-white d-flex align-items-center justify-content-between p-3" onClick={() => setInfoModalContent({
                    title: 'Notifications',
                    body: ['Welcome to RoadRescue! Your profile is verified.', 'Tip: Add your primary vehicle to the garage for faster help.', 'Security: Your login from a new device was successful.'],
                    icon: 'fa-bell text-warning'
                  })}>
                    <span className="d-flex align-items-center"><i className="fa-solid fa-bell text-muted me-3 fs-5" style={{ width: '24px' }}></i> Notifications</span>
                    <i className="fa-solid fa-chevron-right text-muted small"></i>
                  </button>
                  <button className="list-group-item list-group-item-action bg-transparent border-secondary border-opacity-10 text-white d-flex align-items-center justify-content-between p-3" onClick={() => setInfoModalContent({
                    title: 'Privacy & Security',
                    body: ['Your data is protected with AES-256 encryption.', 'We never share your location data unless you are actively requesting assistance.'],
                    icon: 'fa-shield-halved text-success'
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
                    body: ['Version 1.0', 'Designed for ultimate roadside peace of mind.', 'Our mission is to connect drivers with professional help in minutes, anywhere, anytime.'],
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
            </>
          )}
        </div>
      )}

      {viewState === 'profile_vehicles' && (
        <div className="container mt-4 px-3 text-start animate-fade-in" style={{ maxWidth: '600px' }}>
          {/* Header */}
          <div className="d-flex align-items-center gap-3 mb-4">
            <button className="btn btn-outline-warning btn-sm rounded-pill px-3" onClick={() => setViewState('profile')} style={{ borderColor: 'rgba(255,215,0,0.3)', color: '#FFD700' }}>
              <i className="fa-solid fa-arrow-left me-2"></i> Back
            </button>
            <h3 className="font-outfit fw-bold text-white mb-0">My Vehicles</h3>
          </div>

          {/* List of Vehicles */}
          <div className="glass-card p-4 mb-4" style={{ backgroundColor: 'rgba(20,20,20,0.7)', border: '1px solid #2a2a2a', borderRadius: '24px' }}>
            <h5 className="font-outfit fw-bold text-white mb-3"><i className="fa-solid fa-car text-warning me-2"></i> Saved Vehicles ({vehicles.length})</h5>
            
            {vehicles.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                No vehicles added yet. Add a vehicle below to request help faster.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {vehicles.map((v) => (
                  <div key={v.id} className="p-3 rounded-3 border border-secondary border-opacity-15 bg-dark bg-opacity-30 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-2.5 rounded-3 d-flex align-items-center justify-content-center text-warning" style={{ backgroundColor: 'rgba(255,215,0,0.1)', width: '45px', height: '45px' }}>
                        <i className="fa-solid fa-car fs-4"></i>
                      </div>
                      <div>
                        <h6 className="mb-0 font-outfit text-white fw-bold">{v.year} {v.make} {v.model}</h6>
                        <small className="text-muted d-block mt-0.5">{v.color} • {v.plateNumber}</small>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-outline-warning btn-sm" onClick={() => {
                        setNewVehicle({ make: v.make, model: v.model, year: v.year || '', color: v.color || '', plateNumber: v.plateNumber });
                        setEditingVehicleId(v.id);
                        setIsEditingVehicle(true);
                      }}>
                        <i className="fa-solid fa-pencil"></i>
                      </button>
                      <button className="btn btn-outline-danger btn-sm" onClick={async () => {
                        if (window.confirm("Remove this vehicle?")) {
                          try {
                            await deleteDoc(doc(db, 'users', user.id, 'vehicles', v.id));
                            alert("Vehicle removed successfully!");
                          } catch (err) {
                            alert("Failed to remove vehicle: " + err.message);
                          }
                        }
                      }}>
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add / Edit Form */}
          <div className="glass-card p-4" style={{ backgroundColor: 'rgba(20,20,20,0.7)', border: '1px solid #2a2a2a', borderRadius: '24px' }}>
            <h5 className="font-outfit fw-bold text-white mb-3">
              {isEditingVehicle ? <><i className="fa-solid fa-edit text-warning me-2"></i> Edit Vehicle</> : <><i className="fa-solid fa-plus text-warning me-2"></i> Add New Vehicle</>}
            </h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label text-muted small fw-semibold">Make (e.g. Honda)</label>
                <input 
                  type="text" 
                  className="form-control bg-dark border-secondary border-opacity-35 text-white" 
                  value={newVehicle.make}
                  onChange={(e) => setNewVehicle({...newVehicle, make: e.target.value})}
                  placeholder="Honda"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted small fw-semibold">Model (e.g. City)</label>
                <input 
                  type="text" 
                  className="form-control bg-dark border-secondary border-opacity-35 text-white" 
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                  placeholder="City"
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label text-muted small fw-semibold">Year (optional)</label>
                <input 
                  type="text" 
                  className="form-control bg-dark border-secondary border-opacity-35 text-white" 
                  value={newVehicle.year}
                  onChange={(e) => setNewVehicle({...newVehicle, year: e.target.value})}
                  placeholder="2022"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label text-muted small fw-semibold">Color (optional)</label>
                <input 
                  type="text" 
                  className="form-control bg-dark border-secondary border-opacity-35 text-white" 
                  value={newVehicle.color}
                  onChange={(e) => setNewVehicle({...newVehicle, color: e.target.value})}
                  placeholder="White"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label text-muted small fw-semibold">Plate Number</label>
                <input 
                  type="text" 
                  className="form-control bg-dark border-secondary border-opacity-35 text-white text-uppercase" 
                  value={newVehicle.plateNumber}
                  onChange={(e) => setNewVehicle({...newVehicle, plateNumber: e.target.value.toUpperCase()})}
                  placeholder="DL3C-BY-1234"
                  required
                />
              </div>
            </div>

            <div className="d-flex gap-2 mt-4">
              <button 
                className="btn btn-warning px-4 py-2.5 fw-bold"
                onClick={async () => {
                  if (!newVehicle.make.trim() || !newVehicle.model.trim() || !newVehicle.plateNumber.trim()) {
                    alert("Please provide make, model, and plate number.");
                    return;
                  }
                  try {
                    const vehicleData = {
                      make: newVehicle.make.trim(),
                      model: newVehicle.model.trim(),
                      year: newVehicle.year.trim(),
                      color: newVehicle.color.trim(),
                      plateNumber: newVehicle.plateNumber.trim(),
                      updatedAt: serverTimestamp()
                    };
                    if (isEditingVehicle) {
                      await updateDoc(doc(db, 'users', user.id, 'vehicles', editingVehicleId), vehicleData);
                      alert("Vehicle updated successfully!");
                    } else {
                      vehicleData.createdAt = serverTimestamp();
                      await addDoc(collection(db, 'users', user.id, 'vehicles'), vehicleData);
                      alert("Vehicle added successfully!");
                    }
                    setNewVehicle({ make: '', model: '', year: '', color: '', plateNumber: '' });
                    setIsEditingVehicle(false);
                    setEditingVehicleId(null);
                  } catch (err) {
                    alert("Failed to save vehicle: " + err.message);
                  }
                }}
                style={{ borderRadius: '10px' }}
              >
                {isEditingVehicle ? "Update Vehicle" : "Add Vehicle"}
              </button>
              {isEditingVehicle && (
                <button 
                  className="btn btn-secondary px-4 py-2.5"
                  onClick={() => {
                    setNewVehicle({ make: '', model: '', year: '', color: '', plateNumber: '' });
                    setIsEditingVehicle(false);
                    setEditingVehicleId(null);
                  }}
                  style={{ borderRadius: '10px' }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {viewState === 'profile_contacts' && (
        <div className="container mt-4 px-3 text-start animate-fade-in" style={{ maxWidth: '600px' }}>
          {/* Header */}
          <div className="d-flex align-items-center gap-3 mb-4">
            <button className="btn btn-outline-warning btn-sm rounded-pill px-3" onClick={() => setViewState('profile')} style={{ borderColor: 'rgba(255,215,0,0.3)', color: '#FFD700' }}>
              <i className="fa-solid fa-arrow-left me-2"></i> Back
            </button>
            <h3 className="font-outfit fw-bold text-white mb-0">Emergency Contacts</h3>
          </div>

          <div className="alert bg-warning bg-opacity-10 text-warning p-3 border border-warning border-opacity-20 d-flex align-items-start gap-3 mb-4" style={{ borderRadius: '16px' }}>
            <i className="fa-solid fa-shield-halved fs-4 mt-0.5"></i>
            <div>
              <small className="d-block" style={{ lineHeight: '1.5' }}>
                These contacts will be notified automatically with your live location when you trigger an SOS emergency rescue.
              </small>
            </div>
          </div>

          {/* List of Contacts */}
          <div className="glass-card p-4 mb-4" style={{ backgroundColor: 'rgba(20,20,20,0.7)', border: '1px solid #2a2a2a', borderRadius: '24px' }}>
            <h5 className="font-outfit fw-bold text-white mb-3"><i className="fa-solid fa-address-book text-warning me-2"></i> Saved Contacts ({emergencyContacts.length}/5)</h5>
            
            {emergencyContacts.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                No emergency contacts added yet. Add trusted people to notify during emergencies.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {emergencyContacts.map((c) => (
                  <div key={c.id} className="p-3 rounded-3 border border-secondary border-opacity-15 bg-dark bg-opacity-30 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-2.5 rounded-circle d-flex align-items-center justify-content-center text-white font-bold" style={{ backgroundColor: '#FF6B35', width: '40px', height: '40px', fontSize: '18px' }}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <h6 className="mb-0 font-outfit text-white fw-bold">{c.name}</h6>
                          {c.relationship && (
                            <span className="badge bg-secondary bg-opacity-25 text-warning font-outfit" style={{ fontSize: '10px', border: '1px solid rgba(255,215,0,0.15)', padding: '2px 6px' }}>
                              {c.relationship}
                            </span>
                          )}
                        </div>
                        <small className="text-muted d-block mt-1">{c.phone}</small>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-outline-warning btn-sm" onClick={() => {
                        setNewContact({ name: c.name, relationship: c.relationship || '', phone: c.phone });
                        setEditingContactId(c.id);
                        setIsEditingContact(true);
                      }}>
                        <i className="fa-solid fa-pencil"></i>
                      </button>
                      <button className="btn btn-outline-danger btn-sm" onClick={async () => {
                        if (window.confirm(`Remove ${c.name} from emergency contacts?`)) {
                          try {
                            await deleteDoc(doc(db, 'users', user.id, 'emergencyContacts', c.id));
                            alert("Contact removed successfully!");
                          } catch (err) {
                            alert("Failed to remove contact: " + err.message);
                          }
                        }
                      }}>
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add / Edit Form */}
          {emergencyContacts.length < 5 || isEditingContact ? (
            <div className="glass-card p-4" style={{ backgroundColor: 'rgba(20,20,20,0.7)', border: '1px solid #2a2a2a', borderRadius: '24px' }}>
              <h5 className="font-outfit fw-bold text-white mb-3">
                {isEditingContact ? <><i className="fa-solid fa-edit text-warning me-2"></i> Edit Contact</> : <><i className="fa-solid fa-plus text-warning me-2"></i> Add Emergency Contact</>}
              </h5>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label text-muted small fw-semibold">Name</label>
                  <input 
                    type="text" 
                    className="form-control bg-dark border-secondary border-opacity-35 text-white" 
                    value={newContact.name}
                    onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                    placeholder="Ananya Sharma"
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label text-muted small fw-semibold">Relationship</label>
                  <input 
                    type="text" 
                    className="form-control bg-dark border-secondary border-opacity-35 text-white" 
                    value={newContact.relationship || ''}
                    onChange={(e) => setNewContact({...newContact, relationship: e.target.value})}
                    placeholder="e.g. Spouse, Parent, Friend"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label text-muted small fw-semibold">Phone Number</label>
                  <input 
                    type="tel" 
                    className="form-control bg-dark border-secondary border-opacity-35 text-white" 
                    value={newContact.phone}
                    onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                    placeholder="+91 9876543210"
                    required
                  />
                </div>
              </div>

              <div className="d-flex gap-2 mt-4">
                <button 
                  className="btn btn-warning px-4 py-2.5 fw-bold"
                  onClick={async () => {
                    const trimmedName = newContact.name.trim();
                    const trimmedRelationship = (newContact.relationship || '').trim();
                    const trimmedPhone = newContact.phone.trim();

                    if (!trimmedName || !trimmedPhone) {
                      alert('Please enter both name and phone number.');
                      return;
                    }
                    
                    const cleanPhone = trimmedPhone.replace(/[-\s\(\)\.]/g, '');
                    const phoneRegex = /^\+?[0-9]{7,15}$/;
                    if (!phoneRegex.test(cleanPhone)) {
                      alert('Please enter a valid phone number (7 to 15 digits).');
                      return;
                    }

                    if (!isEditingContact && emergencyContacts.length >= 5) {
                      alert('You can add a maximum of 5 emergency contacts.');
                      return;
                    }

                    const isDuplicate = emergencyContacts.some(c => {
                      if (isEditingContact && c.id === editingContactId) return false;
                      const cleanExisting = c.phone.replace(/[-\s\(\)\.]/g, '');
                      return cleanExisting === cleanPhone;
                    });

                    if (isDuplicate) {
                      alert('This phone number is already registered in your emergency contacts.');
                      return;
                    }

                    try {
                      const contactData = {
                        name: trimmedName,
                        relationship: trimmedRelationship,
                        phone: trimmedPhone,
                        updatedAt: serverTimestamp()
                      };
                      if (isEditingContact) {
                        await updateDoc(doc(db, 'users', user.id, 'emergencyContacts', editingContactId), contactData);
                        alert("Contact updated successfully!");
                      } else {
                        contactData.createdAt = serverTimestamp();
                        await addDoc(collection(db, 'users', user.id, 'emergencyContacts'), contactData);
                        alert("Contact added successfully!");
                      }
                      setNewContact({ name: '', relationship: '', phone: '' });
                      setIsEditingContact(false);
                      setEditingContactId(null);
                    } catch (err) {
                      alert("Failed to save contact: " + err.message);
                    }
                  }}
                  style={{ borderRadius: '10px' }}
                >
                  {isEditingContact ? "Update Contact" : "Add Contact"}
                </button>
                {isEditingContact && (
                  <button 
                    className="btn btn-secondary px-4 py-2.5"
                    onClick={() => {
                      setNewContact({ name: '', relationship: '', phone: '' });
                      setIsEditingContact(false);
                      setEditingContactId(null);
                    }}
                    style={{ borderRadius: '10px' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="alert bg-secondary bg-opacity-10 text-muted p-3 border border-secondary border-opacity-15 text-center mt-3" style={{ borderRadius: '16px' }}>
              You have reached the maximum limit of 5 emergency contacts.
            </div>
          )}
        </div>
      )}

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
                  <button type="button" className="btn btn-warning fw-bold py-2.5" style={{ borderRadius: '12px' }} onClick={() => setInfoModalContent(null)}>
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

export default CustomerDashboard;
