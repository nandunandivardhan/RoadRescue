/**
 * Enterprise Web API Integration
 * Dual-Mode: Direct Firestore Database + Firebase Auth / Spring Boot REST API Fallback
 */
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from './firebase';
import axios from 'axios';

// Toggle to easily switch web app back and forth between Spring Boot/MySQL and Firebase/Firestore
export const USE_FIREBASE_WEB = true;

const REST_BASE_URL = 'http://localhost:8080/api';
const restApi = axios.create({
  baseURL: REST_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

restApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * AUTH APIs
 */
export const login = async (email, password) => {
  if (USE_FIREBASE_WEB) {
    const credentials = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = credentials.user;

    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (!userDoc.exists()) {
      throw new Error('User profile does not exist in Firestore database.');
    }

    const userData = userDoc.data();
    
    // Automatically set mechanic online on login using merge-safe setDoc to prevent "No document to update" errors
    if (userData.role === 'mechanic') {
      try {
        await setDoc(doc(db, 'mechanics', firebaseUser.uid), {
          userId: firebaseUser.uid,
          isOnline: true,
          isAvailable: true,
          lastLocationUpdate: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.error('Failed to set mechanic online status on login:', e);
      }
    }

    const authResponse = {
      token: firebaseUser.uid, // UID as token compatibility
      id: firebaseUser.uid,
      name: userData.name || 'RoadRescue User',
      email: firebaseUser.email,
      role: (userData.role || 'USER').toUpperCase(),
      phone: userData.phone || '',
      avatarUrl: userData.avatarUrl || ''
    };

    return { data: authResponse };
  } else {
    return restApi.post('/auth/login', { email, password });
  }
};

export const register = async (userData) => {
  if (USE_FIREBASE_WEB) {
    const credentials = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const firebaseUser = credentials.user;

    const profile = {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      name: userData.name,
      email: userData.email,
      role: userData.role.toLowerCase(),
      roles: [userData.role.toLowerCase()],
      phone: userData.phone || '',
      phoneNumber: userData.phone || '',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=FF6B35&color=fff`,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=FF6B35&color=fff`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // 1. Write users collection safely with merge: true
    await setDoc(doc(db, 'users', firebaseUser.uid), profile, { merge: true });

    // 2. Write mechanics collection if role is mechanic safely with merge: true
    if (profile.role === 'mechanic') {
      await setDoc(doc(db, 'mechanics', firebaseUser.uid), {
        userId: firebaseUser.uid,
        specialty: userData.specialty || 'flat_tire',
        experienceYears: parseInt(userData.experienceYears) || 5,
        rating: 0.0,
        totalReviews: 0,
        isOnline: true,
        isAvailable: true,
        latitude: 28.4595,
        longitude: 77.0266,
        lastLocationUpdate: serverTimestamp()
      }, { merge: true });
    }

    const authResponse = {
      token: firebaseUser.uid,
      id: firebaseUser.uid,
      name: profile.name,
      email: profile.email,
      role: profile.role.toUpperCase(),
      phone: profile.phone,
      avatarUrl: profile.avatarUrl
    };

    return { data: authResponse };
  } else {
    return restApi.post('/auth/register', userData);
  }
};

// Web exclusive helper for Google Authentication Popup
export const loginWithGoogleWeb = async (role) => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  
  const credentials = await signInWithPopup(auth, provider);
  const firebaseUser = credentials.user;

  const userDocRef = doc(db, 'users', firebaseUser.uid);
  const userDoc = await getDoc(userDocRef);

  let profile;
  if (userDoc.exists()) {
    const data = userDoc.data();
    profile = {
      token: firebaseUser.uid,
      id: firebaseUser.uid,
      name: data.name || firebaseUser.displayName || 'RoadRescue User',
      email: firebaseUser.email,
      role: (data.role || role || 'USER').toUpperCase(),
      phone: data.phone || data.phoneNumber || '',
      phoneNumber: data.phone || data.phoneNumber || '',
      avatar: data.avatar || data.avatarUrl || firebaseUser.photoURL || '',
      avatarUrl: data.avatar || data.avatarUrl || firebaseUser.photoURL || ''
    };
    
    // Ensure mechanics doc exists if role is mechanic but document is missing
    if (profile.role.toLowerCase() === 'mechanic') {
      const mechDocRef = doc(db, 'mechanics', firebaseUser.uid);
      const mechSnap = await getDoc(mechDocRef);
      if (!mechSnap.exists()) {
        await setDoc(mechDocRef, {
          userId: firebaseUser.uid,
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
    }
  } else {
    profile = {
      token: firebaseUser.uid,
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'RoadRescue User',
      email: firebaseUser.email,
      role: (role || 'USER').toUpperCase(),
      phone: '',
      phoneNumber: '',
      avatar: firebaseUser.photoURL || '',
      avatarUrl: firebaseUser.photoURL || '',
      createdAt: serverTimestamp()
    };
    
    // Create new profile record in Firestore safely with merge: true
    await setDoc(userDocRef, {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      name: profile.name,
      email: profile.email,
      role: profile.role.toLowerCase(),
      roles: [profile.role.toLowerCase()],
      phone: '',
      phoneNumber: '',
      avatar: profile.avatarUrl,
      avatarUrl: profile.avatarUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    if (profile.role.toLowerCase() === 'mechanic') {
      const mechDocRef = doc(db, 'mechanics', firebaseUser.uid);
      await setDoc(mechDocRef, {
        userId: firebaseUser.uid,
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
  }

  return { data: profile };
};

/**
 * REQUEST APIs
 */
export const createServiceRequest = async (data) => {
  if (USE_FIREBASE_WEB) {
    const payload = {
      customerId: data.customerId,
      customerName: data.customerName || 'RoadRescue Driver',
      customerPhone: data.customerPhone || '',
      issueType: data.issueType,
      description: data.description || '',
      pickupLatitude: parseFloat(data.pickupLatitude || 0),
      pickupLongitude: parseFloat(data.pickupLongitude || 0),
      pickupAddress: data.pickupAddress || 'Unknown location',
      estimatedCost: parseFloat(data.estimatedCost || 0),
      status: 'pending',
      createdAt: serverTimestamp(),
      mechanicId: null,
      mechanicName: null,
      mechanicPhone: null,
      mechanicLatitude: null,
      mechanicLongitude: null,
      priority: data.priority || 'normal'
    };

    const docRef = await addDoc(collection(db, 'requests'), payload);
    return { data: { id: docRef.id, ...payload } };
  } else {
    return restApi.post('/requests/create', data);
  }
};

export const getRequestById = async (id) => {
  if (USE_FIREBASE_WEB) {
    const snapshot = await getDoc(doc(db, 'requests', id));
    if (snapshot.exists()) {
      return { data: { id: snapshot.id, ...snapshot.data() } };
    }
    throw new Error('Request not found.');
  } else {
    return restApi.get(`/requests/${id}`);
  }
};

export const getActiveRequest = async (userId, role) => {
  if (USE_FIREBASE_WEB) {
    const roleField = role.toLowerCase() === 'mechanic' ? 'mechanicId' : 'customerId';
    const q = query(
      collection(db, 'requests'),
      where(roleField, '==', userId),
      where('status', 'in', ['pending', 'accepted', 'en_route', 'arrived', 'in_progress', 'repairing'])
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const activeDocs = snapshot.docs
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
        .filter(req => {
          // Strict owner check
          if (role.toLowerCase() === 'mechanic') {
            if (req.mechanicId !== userId) return false;
          } else {
            if (req.customerId !== userId) return false;
          }

          // Strict 2-hour timestamp check
          const createdAtMs = req.createdAt?.seconds 
            ? req.createdAt.seconds * 1000 
            : (req.createdAt instanceof Date ? req.createdAt.getTime() : Date.now());
          const timeDiff = Date.now() - createdAtMs;
          return timeDiff <= 2 * 60 * 60 * 1000;
        });

      if (activeDocs.length > 0) {
        // Sort by newest
        activeDocs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        return { data: activeDocs[0] };
      }
    }
    return { data: null };
  } else {
    return restApi.get(`/requests/active/${userId}`, { params: { role } });
  }
};

export const updateRequestStatus = async (id, status) => {
  if (USE_FIREBASE_WEB) {
    const statusLower = status.toLowerCase();
    const payload = { 
      status: statusLower
    };

    if (statusLower === 'completed') {
      payload.completedAt = serverTimestamp();
      try {
        const snap = await getDoc(doc(db, 'requests', id));
        if (snap.exists()) {
          const reqData = snap.data();
          let cost = reqData.estimatedCost;
          if (cost === undefined || cost === null) {
            const serviceCosts = {
              'flat_tire': 450,
              'battery': 600,
              'engine': 1200,
              'fuel': 300,
              'towing': 2500,
              'other': 500
            };
            cost = serviceCosts[reqData.issueType] || 500;
          }
          payload.actualCost = cost;
        } else {
          payload.actualCost = 500;
        }
      } catch (e) {
        console.error('Failed to resolve actualCost for request completion:', e);
        payload.actualCost = 500;
      }
    }

    await updateDoc(doc(db, 'requests', id), payload);

    if (['completed', 'cancelled'].includes(statusLower)) {
      const snap = await getDoc(doc(db, 'requests', id));
      const active = snap.data();
      if (active && active.mechanicId) {
        // Use merge-safe setDoc to ensure document is created if it does not exist
        await setDoc(doc(db, 'mechanics', active.mechanicId), { 
          isAvailable: true, 
          userId: active.mechanicId 
        }, { merge: true });
      }
    }

    const updatedSnap = await getDoc(doc(db, 'requests', id));
    return { data: { id: updatedSnap.id, ...updatedSnap.data() } };
  } else {
    return restApi.put(`/requests/status/${id}`, { status });
  }
};

export const acceptRequest = async (id, mechanicUserId) => {
  if (USE_FIREBASE_WEB) {
    // Fetch mechanic user details
    const userDoc = await getDoc(doc(db, 'users', mechanicUserId));
    const uData = userDoc.exists() ? userDoc.data() : {};

    const payload = {
      status: 'accepted',
      mechanicId: mechanicUserId,
      mechanicName: uData.name || 'Certified Mechanic',
      mechanicPhone: uData.phone || '',
      mechanicLatitude: 28.4595,
      mechanicLongitude: 77.0266
    };

    await updateDoc(doc(db, 'requests', id), payload);
    
    // Automatic Chat Room Creation (FINAL ISSUE 2 FULLY IMPLEMENTED)
    try {
      await addDoc(collection(db, 'requests', id, 'messages'), {
        senderId: 'system',
        senderName: 'RoadRescue System',
        senderRole: 'system',
        text: `Rescue Partner ${uData.name || 'Certified Pro'} has accepted your dispatch and is en-route.`,
        createdAt: serverTimestamp()
      });
    } catch (chatErr) {
      console.error('Failed to auto-create chat room:', chatErr);
    }
    
    // Use merge-safe setDoc to ensure mechanics document exists
    await setDoc(doc(db, 'mechanics', mechanicUserId), { 
      isAvailable: false, 
      userId: mechanicUserId 
    }, { merge: true });

    const updatedSnap = await getDoc(doc(db, 'requests', id));
    return { data: { id: updatedSnap.id, ...updatedSnap.data() } };
  } else {
    return restApi.post(`/requests/accept/${id}`, { mechanicUserId });
  }
};

export const cancelRequest = async (id) => {
  if (USE_FIREBASE_WEB) {
    await updateDoc(doc(db, 'requests', id), { status: 'cancelled' });
    const snap = await getDoc(doc(db, 'requests', id));
    const active = snap.data();
    if (active && active.mechanicId) {
      // Use merge-safe setDoc to ensure mechanics document exists
      await setDoc(doc(db, 'mechanics', active.mechanicId), { 
        isAvailable: true, 
        userId: active.mechanicId 
      }, { merge: true });
    }
    return { data: { id, ...active } };
  } else {
    return restApi.post(`/requests/cancel/${id}`);
  }
};

export const getRequestHistory = async (userId, role) => {
  if (USE_FIREBASE_WEB) {
    const roleField = role.toLowerCase() === 'mechanic' ? 'mechanicId' : 'customerId';
    const q = query(
      collection(db, 'requests'),
      where(roleField, '==', userId)
    );
    const snapshot = await getDocs(q);
    const history = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    
    // Sort in memory to avoid requiring complex Firestore composite indexes
    history.sort((a, b) => {
      const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
      const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
      return bTime - aTime;
    });

    return { data: history };
  } else {
    return restApi.get(`/requests/history/${userId}`, { params: { role } });
  }
};

export const getNearbyRequests = async (lat, lng, radius = 25) => {
  if (USE_FIREBASE_WEB) {
    const q = query(
      collection(db, 'requests'),
      where('status', '==', 'pending')
    );
    const snapshot = await getDocs(q);
    const history = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    return { data: history };
  } else {
    return restApi.get('/requests/nearby', { params: { lat, lng, radius } });
  }
};

export const getAllRequests = async () => {
  if (USE_FIREBASE_WEB) {
    const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const requests = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    return { data: requests };
  } else {
    return restApi.get('/requests');
  }
};

/**
 * MECHANIC APIs
 */
export const getNearbyMechanics = async (lat, lng, radius = 25) => {
  if (USE_FIREBASE_WEB) {
    const q = query(collection(db, 'mechanics'), where('isOnline', '==', true));
    const snapshot = await getDocs(q);
    
    const mechanics = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const mechData = docSnap.data();
      let name = 'Certified Mechanic';
      let phone = '';
      try {
        const uDoc = await getDoc(doc(db, 'users', mechData.userId));
        if (uDoc.exists()) {
          name = uDoc.data().name || name;
          phone = uDoc.data().phone || phone;
        }
      } catch (e) {}

      return {
        id: docSnap.id,
        userId: mechData.userId,
        specialty: mechData.specialty || 'flat_tire',
        experienceYears: mechData.experienceYears || 5,
        rating: mechData.rating !== undefined && mechData.rating !== null ? mechData.rating : 0.0,
        totalReviews: mechData.totalReviews || 0,
        isOnline: mechData.isOnline,
        isAvailable: mechData.isAvailable,
        latitude: mechData.latitude,
        longitude: mechData.longitude,
        name,
        phone
      };
    }));

    return { data: mechanics };
  } else {
    return restApi.get('/mechanics/nearby', { params: { lat, lng, radius } });
  }
};

export const updateAvailability = async (mechanicId, isAvailable) => {
  if (USE_FIREBASE_WEB) {
    // Use merge-safe setDoc to ensure mechanics document exists
    await setDoc(doc(db, 'mechanics', mechanicId), { 
      isAvailable, 
      userId: mechanicId 
    }, { merge: true });
    const snap = await getDoc(doc(db, 'mechanics', mechanicId));
    return { data: snap.data() };
  } else {
    return restApi.put(`/mechanics/${mechanicId}/availability`, { isAvailable });
  }
};

export const updateMechanicLocation = async (mechanicId, latitude, longitude) => {
  if (USE_FIREBASE_WEB) {
    // Use merge-safe setDoc to ensure mechanics document exists
    await setDoc(doc(db, 'mechanics', mechanicId), { 
      latitude, 
      longitude, 
      userId: mechanicId,
      lastLocationUpdate: serverTimestamp() 
    }, { merge: true });
    const snap = await getDoc(doc(db, 'mechanics', mechanicId));
    return { data: snap.data() };
  } else {
    return restApi.patch(`/mechanics/${mechanicId}/location`, { latitude, longitude });
  }
};

export const updateMechanicStatus = async (mechanicId, isOnline, isAvailable) => {
  if (USE_FIREBASE_WEB) {
    // Use merge-safe setDoc to ensure mechanics document exists
    await setDoc(doc(db, 'mechanics', mechanicId), { 
      isOnline, 
      isAvailable, 
      userId: mechanicId 
    }, { merge: true });
    const snap = await getDoc(doc(db, 'mechanics', mechanicId));
    return { data: snap.data() };
  } else {
    return restApi.patch(`/mechanics/${mechanicId}/status`, null, { params: { isOnline, isAvailable } });
  }
};

/**
 * Real-time Firestore Subscriptions (Web)
 */
export const subscribeToActiveRequest = (userId, role, onUpdate) => {
  if (!USE_FIREBASE_WEB) {
    // If not using Firebase, return dummy cleanup and trigger one-off call
    const interval = setInterval(async () => {
      try {
        const res = await getActiveRequest(userId, role);
        onUpdate(res.data);
      } catch (e) {
        onUpdate(null);
      }
    }, 4000);
    return () => clearInterval(interval);
  }

  const roleField = role.toLowerCase() === 'mechanic' ? 'mechanicId' : 'customerId';
  // Include 'completed' only for customers so tracking screen can prompt for rating.
  // Mechanics should immediately leave active status when completed.
  const activeStatuses = role.toLowerCase() === 'mechanic'
    ? ['pending', 'accepted', 'en_route', 'arrived', 'in_progress', 'repairing']
    : ['pending', 'accepted', 'en_route', 'arrived', 'in_progress', 'repairing', 'completed'];

  const q = query(
    collection(db, 'requests'),
    where(roleField, '==', userId),
    where('status', 'in', activeStatuses)
  );

  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      const validDocs = snapshot.docs
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
        .filter(req => {
          // Strict owner check
          if (role.toLowerCase() === 'mechanic') {
            if (req.mechanicId !== userId) return false;
          } else {
            if (req.customerId !== userId) return false;
          }

          // Strict terminal state checks to avoid reviewed or closed requests showing up
          if (req.driverAcknowledged === true || req.rating !== undefined || ['reviewed', 'closed'].includes(req.status?.toLowerCase())) {
            return false;
          }

          // Strict 2-hour timestamp check
          const createdAtMs = req.createdAt?.seconds 
            ? req.createdAt.seconds * 1000 
            : (req.createdAt instanceof Date ? req.createdAt.getTime() : Date.now());
          const timeDiff = Date.now() - createdAtMs;
          const twoHours = 2 * 60 * 60 * 1000;
          return timeDiff <= twoHours;
        });

      if (validDocs.length > 0) {
        // Sort by newest
        validDocs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        onUpdate(validDocs[0]);
      } else {
        onUpdate(null);
      }
    } else {
      onUpdate(null);
    }
  }, (error) => {
    console.error("Active Request Subscription Error:", error);
    onUpdate(null);
  });
};

export const subscribeToNearbyRequests = (onUpdate) => {
  if (!USE_FIREBASE_WEB) {
    const interval = setInterval(async () => {
      try {
        const res = await getNearbyRequests(28.4595, 77.0266, 25);
        onUpdate(res.data || []);
      } catch (e) {
        onUpdate([]);
      }
    }, 4000);
    return () => clearInterval(interval);
  }

  const q = query(
    collection(db, 'requests'),
    where('status', '==', 'pending')
  );

  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    onUpdate(requests);
  }, (error) => {
    console.error("Nearby Requests Subscription Error:", error);
    onUpdate([]);
  });
};

export const subscribeToOnlineMechanics = (onUpdate) => {
  if (!USE_FIREBASE_WEB) {
    const interval = setInterval(async () => {
      try {
        const res = await getNearbyMechanics(28.4595, 77.0266, 25);
        onUpdate(res.data || []);
      } catch (e) {
        onUpdate([]);
      }
    }, 5000);
    return () => clearInterval(interval);
  }

  const q = query(collection(db, 'mechanics'), where('isOnline', '==', true));
  
  return onSnapshot(q, async (snapshot) => {
    const mechanics = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const mechData = docSnap.data();
      let name = 'Certified Mechanic';
      let phone = '';
      try {
        const uDoc = await getDoc(doc(db, 'users', mechData.userId));
        if (uDoc.exists()) {
          name = uDoc.data().name || name;
          phone = uDoc.data().phone || phone;
        }
      } catch (e) {}

      return {
        id: docSnap.id,
        userId: mechData.userId,
        specialty: mechData.specialty || 'flat_tire',
        experienceYears: mechData.experienceYears || 5,
        rating: mechData.rating !== undefined && mechData.rating !== null ? mechData.rating : 0.0,
        totalReviews: mechData.totalReviews || 0,
        isOnline: mechData.isOnline,
        isAvailable: mechData.isAvailable,
        latitude: mechData.latitude,
        longitude: mechData.longitude,
        name,
        phone
      };
    }));

    onUpdate(mechanics);
  }, (error) => {
    console.error("Online Mechanics Subscription Error:", error);
    onUpdate([]);
  });
};

/**
 * Real-time Chat System (FINAL ISSUE 2 FIXED!)
 */
export const sendMessage = async (requestId, userId, userName, role, text) => {
  const msgPayload = {
    senderId: userId,
    senderName: userName,
    senderRole: role.toLowerCase(),
    text,
    createdAt: serverTimestamp()
  };
  await addDoc(collection(db, 'requests', requestId, 'messages'), msgPayload);
  
  await updateDoc(doc(db, 'requests', requestId), {
    lastMessageText: text,
    lastMessageSender: userId,
    lastMessageTime: serverTimestamp()
  });
};

export const subscribeToMessages = (requestId, onUpdate) => {
  const q = query(
    collection(db, 'requests', requestId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    onUpdate(list);
  }, (error) => {
    console.error("Chat subscription error:", error);
    onUpdate([]);
  });
};

/**
 * Dynamic User Profile Contact Management (FINAL ISSUE 2 FIXED)
 */
export const updateUserProfilePhone = async (userId, role, phoneNumber, emergencyContact = '') => {
  const userDocRef = doc(db, 'users', userId);
  const userPayload = {
    phone: phoneNumber,
    phoneNumber: phoneNumber,
    updatedAt: serverTimestamp()
  };
  if (emergencyContact !== undefined) {
    userPayload.emergencyContact = emergencyContact;
  }
  await updateDoc(userDocRef, userPayload);

  if (role.toLowerCase() === 'mechanic') {
    const mechDocRef = doc(db, 'mechanics', userId);
    await setDoc(mechDocRef, {
      phone: phoneNumber,
      phoneNumber: phoneNumber,
      userId: userId,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }
};

export default restApi;
