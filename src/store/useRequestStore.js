/**
 * Request Store — Zustand
 * Manages service request state for both Customer and Mechanic roles via Firestore / Spring Boot REST API
 */
import { create } from 'zustand';
import { calculateDistance } from '../utils/helpers';
import * as api from '../services/api';
import { sendLocalNotification } from '../services/notification';
import { 
  USE_FIREBASE_FIRESTORE, 
  db 
} from '../services/firebase';
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

let nearbyDebounceTimer = null;

const useRequestStore = create((set, get) => ({
  // State
  activeRequest: null,       // Current active service request
  nearbyRequests: [],        // For mechanics: nearby pending requests
  onlineMechanics: [],       // For customers: realtime online mechanics
  requestHistory: [],        // Past requests
  isLoading: false,
  error: null,
  intervals: {},             // Polling intervals (REST fallback)
  unsubscribes: {},          // Firestore real-time onSnapshot unsubscribes

  // Actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  /**
   * CUSTOMER: Create a new service request
   */
  createRequest: async (requestData) => {
    set({ isLoading: true, error: null });
    
    if (USE_FIREBASE_FIRESTORE) {
      try {
        const payload = {
          customerId: requestData.customerId,
          customerName: requestData.customerName || 'RoadRescue Driver',
          customerPhone: requestData.customerPhone || '',
          issueType: requestData.issueType,
          description: requestData.description || '',
          vehicleInfo: requestData.vehicleInfo || '',
          location: {
            latitude: parseFloat(requestData.location?.latitude || 0),
            longitude: parseFloat(requestData.location?.longitude || 0),
          },
          pickupLatitude: parseFloat(requestData.location?.latitude || 0),
          pickupLongitude: parseFloat(requestData.location?.longitude || 0),
          pickupAddress: requestData.locationAddress || 'Unknown',
          estimatedCost: parseFloat(requestData.estimatedCost || 0),
          status: 'pending',
          createdAt: serverTimestamp(),
          mechanicId: null,
          mechanicName: null,
          mechanicPhone: null,
          mechanicLatitude: null,
          mechanicLongitude: null
        };

        const docRef = await addDoc(collection(db, 'requests'), payload);
        const created = {
          id: docRef.id,
          uid: docRef.id,
          ...payload,
          locationLat: payload.pickupLatitude,
          locationLng: payload.pickupLongitude,
        };

        set({ activeRequest: created, isLoading: false });
        
        // Listen to updates in real-time
        get().listenToRequest(docRef.id);

        return { success: true, request: created };
      } catch (error) {
        console.error('Firebase createRequest error:', error);
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }
    } else {
      // Fallback: REST
      try {
        const payload = {
          customerId: requestData.customerId,
          issueType: requestData.issueType,
          description: requestData.description || '',
          pickupLatitude: parseFloat(requestData.location?.latitude || 0),
          pickupLongitude: parseFloat(requestData.location?.longitude || 0),
          pickupAddress: requestData.locationAddress || 'Unknown',
          estimatedCost: parseFloat(requestData.estimatedCost || 0),
        };

        const response = await api.createServiceRequest(payload);
        const created = {
          ...response.data,
          uid: response.data.id.toString(), 
          locationLat: response.data.pickupLatitude,
          locationLng: response.data.pickupLongitude,
        };

        set({ activeRequest: created, isLoading: false });
        get().listenToRequest(created.id);

        return { success: true, request: created };
      } catch (error) {
        console.error('Create request error:', error);
        const msg = error.response?.data?.message || error.message || 'Failed to create request';
        set({ isLoading: false, error: msg });
        return { success: false, error: msg };
      }
    }
  },

  /**
   * Listen to active request updates in real-time
   */
  listenToRequest: (requestId) => {
    // Clear existing unsubscriptions/intervals
    get().cleanup(false);

    if (USE_FIREBASE_FIRESTORE) {
      const unsub = onSnapshot(doc(db, 'requests', requestId), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const request = {
            id: snapshot.id,
            uid: snapshot.id,
            ...data,
            locationLat: data.pickupLatitude,
            locationLng: data.pickupLongitude,
            location: {
              latitude: data.pickupLatitude || data.location?.latitude || 0,
              longitude: data.pickupLongitude || data.location?.longitude || 0
            },
            mechanicLocation: data.mechanicLatitude ? {
              latitude: data.mechanicLatitude,
              longitude: data.mechanicLongitude
            } : null
          };

          const previousStatus = get().activeRequest?.status;
          set({ activeRequest: request });

          // Send push notifications on status updates
          if (request.status !== previousStatus && previousStatus) {
            const statusLower = request.status.toLowerCase();
            
            if (statusLower === 'accepted') {
              sendLocalNotification(
                '🔧 Mechanic Found!',
                `${request.mechanicName || 'A mechanic'} has accepted your request.`
              );
            } else if (statusLower === 'en_route') {
              sendLocalNotification(
                '🚚 Help is on the way!',
                `${request.mechanicName || 'Your mechanic'} is heading to your location.`
              );
            } else if (statusLower === 'arrived') {
              sendLocalNotification(
                '📍 Mechanic Arrived!',
                'Your mechanic has reached your location.'
              );
            } else if (statusLower === 'completed') {
              sendLocalNotification(
                '✅ Service Complete!',
                'Your service has been completed. Thank you!'
              );
              get().cleanup(false);
            }
          }
        } else {
          // Document deleted
          set({ activeRequest: null });
        }
      });

      set(state => ({
        unsubscribes: { ...state.unsubscribes, request: unsub }
      }));

      return unsub;
    } else {
      // Fallback: REST Polling
      const poll = async () => {
        try {
          const response = await api.getRequestById(requestId);
          const data = {
            ...response.data,
            uid: response.data.id.toString(),
            locationLat: response.data.pickupLatitude,
            locationLng: response.data.pickupLongitude,
            location: {
              latitude: response.data.pickupLatitude,
              longitude: response.data.pickupLongitude
            },
            mechanicLocation: response.data.mechanicLatitude ? {
              latitude: response.data.mechanicLatitude,
              longitude: response.data.mechanicLongitude
            } : null
          };

          const previousStatus = get().activeRequest?.status;
          set({ activeRequest: data });

          if (data.status !== previousStatus && previousStatus) {
            const statusLower = data.status.toLowerCase();
            if (statusLower === 'accepted') {
              sendLocalNotification('🔧 Mechanic Found!', `${data.mechanicName || 'A mechanic'} has accepted your request.`);
            } else if (statusLower === 'en_route') {
              sendLocalNotification('🚚 Help is on the way!', `${data.mechanicName || 'Your mechanic'} is heading.`);
            } else if (statusLower === 'arrived') {
              sendLocalNotification('📍 Mechanic Arrived!', 'Your mechanic has reached.');
            } else if (statusLower === 'completed') {
              sendLocalNotification('✅ Service Complete!', 'Your service has been completed.');
              get().cleanup(false);
            }
          }
        } catch (error) {
          console.error('Error polling request details:', error);
        }
      };

      poll();
      const intervalId = setInterval(poll, 4000);
      set(state => ({
        intervals: { ...state.intervals, request: intervalId }
      }));

      return () => clearInterval(intervalId);
    }
  },

  /**
   * Restore active request on app start
   */
  fetchActiveRequest: async (userId, role) => {
    set({ isLoading: true });

    if (USE_FIREBASE_FIRESTORE) {
      try {
        const q = query(
          collection(db, 'requests'),
          where(role === 'mechanic' ? 'mechanicId' : 'customerId', '==', userId),
          where('status', 'in', ['pending', 'accepted', 'en_route', 'arrived', 'in_progress', 'repairing'])
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const data = docSnap.data();
          
          const createdAtMs = data.createdAt?.toMillis?.() || (data.createdAt?.seconds ? data.createdAt.seconds * 1000 : 0) || Date.now();
          const TWO_HOURS = 2 * 60 * 60 * 1000;
          const isFresh = Date.now() - createdAtMs < TWO_HOURS;
          
          const ACTIVE_STATUSES = [
            'accepted',
            'en_route',
            'arrived',
            'in_progress',
            'repairing'
          ];
          
          const isUserMatch = role === 'mechanic' ? (data.mechanicId === userId) : (data.customerId === userId);
          
          if (!isUserMatch || !isFresh) {
            set({ activeRequest: null, isLoading: false });
            return null;
          }

          const active = {
            id: docSnap.id,
            uid: docSnap.id,
            ...data,
            locationLat: data.pickupLatitude,
            locationLng: data.pickupLongitude,
            location: {
              latitude: data.pickupLatitude || data.location?.latitude || 0,
              longitude: data.pickupLongitude || data.location?.longitude || 0
            },
            mechanicLocation: data.mechanicLatitude ? {
              latitude: data.mechanicLatitude,
              longitude: data.mechanicLongitude
            } : null
          };

          set({ activeRequest: active, isLoading: false });
          get().listenToRequest(docSnap.id);
          return active;
        }

        set({ activeRequest: null, isLoading: false });
        return null;
      } catch (error) {
        console.error('Firebase fetchActiveRequest error:', error);
        set({ activeRequest: null, isLoading: false });
        return null;
      }
    } else {
      // Fallback REST
      try {
        const response = await api.getActiveRequest(userId, role);
        if (response.data) {
          const data = {
            ...response.data,
            uid: response.data.id.toString(),
            locationLat: response.data.pickupLatitude,
            locationLng: response.data.pickupLongitude,
            location: {
              latitude: response.data.pickupLatitude,
              longitude: response.data.pickupLongitude
            },
            mechanicLocation: response.data.mechanicLatitude ? {
              latitude: response.data.mechanicLatitude,
              longitude: response.data.mechanicLongitude
            } : null
          };
          
          const createdAtMs = data.createdAt ? new Date(data.createdAt).getTime() : Date.now();
          const TWO_HOURS = 2 * 60 * 60 * 1000;
          const isFresh = Date.now() - createdAtMs < TWO_HOURS;
          
          if (!isFresh) {
            set({ activeRequest: null, isLoading: false });
            return null;
          }

          set({ activeRequest: data, isLoading: false });
          get().listenToRequest(data.id);
          return data;
        }
        set({ activeRequest: null, isLoading: false });
        return null;
      } catch (error) {
        set({ activeRequest: null, isLoading: false });
        return null;
      }
    }
  },

  /**
   * Listen to real-time online mechanics (Customer side)
   */
  listenToOnlineMechanics: () => {
    get().cleanup(false);

    if (USE_FIREBASE_FIRESTORE) {
      const q = query(
        collection(db, 'mechanics'),
        where('isOnline', '==', true)
      );

      const unsub = onSnapshot(q, async (snapshot) => {
        const mechanics = await Promise.all(snapshot.docs.map(async (docSnap) => {
          const mechData = docSnap.data();
          
          // Fetch linked user details to load name and phone
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
            uid: mechData.userId,
            userId: mechData.userId,
            name,
            phoneNumber: phone,
            specialty: mechData.specialty || 'flat_tire',
            experienceYears: mechData.experienceYears || 5,
            rating: mechData.rating || 5.0,
            location: {
              latitude: mechData.latitude,
              longitude: mechData.longitude
            }
          };
        }));

        set({ onlineMechanics: mechanics });
      });

      set(state => ({
        unsubscribes: { ...state.unsubscribes, mechanics: unsub }
      }));

      return unsub;
    } else {
      // Fallback REST
      const poll = async () => {
        try {
          const response = await api.getNearbyMechanics(12.9716, 77.5946, 100);
          const mechanics = response.data.map(m => ({
            ...m,
            uid: m.userId.toString(),
          }));
          set({ onlineMechanics: mechanics });
        } catch (error) {
          console.error('Error polling online mechanics:', error);
        }
      };

      poll();
      const intervalId = setInterval(poll, 5000);
      set(state => ({
        intervals: { ...state.intervals, mechanics: intervalId }
      }));

      return () => clearInterval(intervalId);
    }
  },

  /**
   * MECHANIC: Listen for nearby pending requests
   */
  listenToNearbyRequests: (mechanicLocation = null) => {
    get().cleanup(false);

    if (USE_FIREBASE_FIRESTORE) {
      const q = query(
        collection(db, 'requests'),
        where('status', 'in', ['pending', 'emergency', 'priority', 'accepted', 'assigned'])
      );

      const unsub = onSnapshot(q, (snapshot) => {
        // Clear any pending state updates to debounce rapid Firestore mutations
        if (nearbyDebounceTimer) {
          clearTimeout(nearbyDebounceTimer);
        }

        nearbyDebounceTimer = setTimeout(() => {
          const previousCount = get().nearbyRequests.length;
          
          // Deduplicate by request.id using a Map
          const requestMap = new Map();
          
          snapshot.docs.forEach(docSnap => {
            const r = docSnap.data();
            const reqId = docSnap.id;
            
            const requestObj = {
              id: reqId,
              uid: reqId,
              ...r,
              locationLat: r.pickupLatitude,
              locationLng: r.pickupLongitude,
              location: {
                latitude: r.pickupLatitude || r.location?.latitude || 0,
                longitude: r.pickupLongitude || r.location?.longitude || 0
              }
            };
            
            requestMap.set(reqId, requestObj);
          });
          
          const requests = Array.from(requestMap.values());

          // Sort requests deterministically: SOS/Emergency -> Priority -> Normal
          requests.sort((a, b) => {
            const getWeight = (req) => {
              const p = (req.priority || '').toLowerCase();
              if (p === 'emergency' || p === 'sos') return 3;
              if (p === 'priority') return 2;
              if (p === 'normal') return 1;
              return 0;
            };

            const weightA = getWeight(a);
            const weightB = getWeight(b);

            if (weightA !== weightB) {
              return weightB - weightA;
            }

            const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
            const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
            return timeB - timeA;
          });

          set({ nearbyRequests: requests });

          if (requests.length > previousCount) {
            sendLocalNotification(
              '🚨 New Service Request!',
              'A customer nearby needs assistance. Open the app to accept.'
            );
          }
        }, 300);
      }, (error) => {
        console.error('Firebase listenToNearbyRequests error:', error);
        // Offline cache preservation: preserve cached nearbyRequests on disconnect
        console.log('[Offline Cache] Preserving cached nearbyRequests due to disconnect.');
      });

      set(state => ({
        unsubscribes: { ...state.unsubscribes, nearby: unsub }
      }));

      return unsub;
    } else {
      // Fallback REST
      const poll = async () => {
        try {
          const lat = mechanicLocation?.latitude || 12.9716;
          const lng = mechanicLocation?.longitude || 77.5946;
          const response = await api.getNearbyRequests(lat, lng, 50);
          const requests = response.data.map(r => ({
            ...r,
            uid: r.id.toString(),
            locationLat: r.pickupLatitude,
            locationLng: r.pickupLongitude,
            location: {
              latitude: r.pickupLatitude,
              longitude: r.pickupLongitude
            }
          }));
          set({ nearbyRequests: requests });
        } catch (error) {
          console.error('Error polling nearby requests:', error);
        }
      };

      poll();
      const intervalId = setInterval(poll, 5000);
      set(state => ({
        intervals: { ...state.intervals, nearby: intervalId }
      }));

      return () => clearInterval(intervalId);
    }
  },

  /**
   * MECHANIC: Accept a service request
   */
  acceptRequest: async (requestId, mechanicData, mechanicLocation = null) => {
    set({ isLoading: true });

    if (USE_FIREBASE_FIRESTORE) {
      try {
        const updatePayload = {
          status: 'accepted',
          mechanicId: mechanicData.uid,
          mechanicName: mechanicData.name,
          mechanicPhone: mechanicData.phoneNumber || mechanicData.phone || '',
          mechanicLatitude: mechanicLocation?.latitude || null,
          mechanicLongitude: mechanicLocation?.longitude || null,
          mechanicLocation: mechanicLocation ? {
            latitude: mechanicLocation.latitude,
            longitude: mechanicLocation.longitude
          } : null
        };

        await updateDoc(doc(db, 'requests', requestId), updatePayload);
        await updateDoc(doc(db, 'mechanics', mechanicData.uid), { isAvailable: false });

        const updatedSnap = await getDoc(doc(db, 'requests', requestId));
        const updatedData = updatedSnap.data();

        const active = {
          id: requestId,
          uid: requestId,
          ...updatedData,
          locationLat: updatedData.pickupLatitude,
          locationLng: updatedData.pickupLongitude,
        };

        set({ activeRequest: active, isLoading: false });
        get().listenToRequest(requestId);
        
        return { success: true };
      } catch (error) {
        console.error('Firebase acceptRequest error:', error);
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }
    } else {
      // Fallback REST
      try {
        const response = await api.acceptRequest(requestId, mechanicData.id);
        const data = {
          ...response.data,
          uid: response.data.id.toString(),
          locationLat: response.data.pickupLatitude,
          locationLng: response.data.pickupLongitude,
        };
        set({ activeRequest: data, isLoading: false });
        get().listenToRequest(data.id);
        return { success: true };
      } catch (error) {
        const msg = error.response?.data?.message || error.message || 'Failed to accept request';
        set({ isLoading: false, error: msg });
        return { success: false, error: msg };
      }
    }
  },

  /**
   * Update request status (used by mechanic)
   */
  updateRequestStatus: async (requestId, newStatus, extraData = {}) => {
    if (USE_FIREBASE_FIRESTORE) {
      try {
        const statusLower = newStatus.toLowerCase();
        const payload = { 
          status: statusLower,
          ...(statusLower === 'completed' ? { completedAt: serverTimestamp(), actualCost: get().activeRequest?.estimatedCost || 500 } : {})
        };

        await updateDoc(doc(db, 'requests', requestId), payload);

        // If completed or cancelled, make mechanic available again
        if (['completed', 'cancelled'].includes(statusLower)) {
          const active = get().activeRequest;
          if (active && active.mechanicId) {
            await updateDoc(doc(db, 'mechanics', active.mechanicId), { isAvailable: true });
          }
          get().cleanup(true);
        }

        return { success: true };
      } catch (error) {
        console.error('Firebase updateRequestStatus error:', error);
        return { success: false, error: error.message };
      }
    } else {
      // Fallback REST
      try {
        const response = await api.updateRequestStatus(requestId, newStatus.toUpperCase());
        const updated = {
          ...response.data,
          uid: response.data.id.toString(),
          locationLat: response.data.pickupLatitude,
          locationLng: response.data.pickupLongitude,
        };
        set({ activeRequest: updated });
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  /**
   * Update mechanic's live location on the request
   */
  updateMechanicLocation: async (requestId, location) => {
    if (USE_FIREBASE_FIRESTORE) {
      try {
        const active = get().activeRequest;
        if (!active || !active.mechanicId) return;

        // 1. Update mechanic's personal location
        await updateDoc(doc(db, 'mechanics', active.mechanicId), {
          latitude: location.latitude,
          longitude: location.longitude,
          lastLocationUpdate: serverTimestamp()
        });

        // 2. Update active request location for live track tracking
        await updateDoc(doc(db, 'requests', requestId), {
          mechanicLatitude: location.latitude,
          mechanicLongitude: location.longitude
        });
      } catch (error) {
        console.error('Firebase updateMechanicLocation error:', error);
      }
    } else {
      // Fallback REST
      try {
        const active = get().activeRequest;
        if (!active || !active.mechanicId) return;
        await api.updateMechanicLocation(active.mechanicId, location.latitude, location.longitude);
      } catch (error) {
        console.error('Location update error:', error);
      }
    }
  },

  /**
   * Cancel a request (customer)
   */
  cancelRequest: async (requestId) => {
    if (USE_FIREBASE_FIRESTORE) {
      try {
        await updateDoc(doc(db, 'requests', requestId), { status: 'cancelled' });
        
        const active = get().activeRequest;
        if (active && active.mechanicId) {
          await updateDoc(doc(db, 'mechanics', active.mechanicId), { isAvailable: true });
        }
        
        get().cleanup(true);
        return { success: true };
      } catch (error) {
        console.error('Firebase cancelRequest error:', error);
        return { success: false, error: error.message };
      }
    } else {
      // Fallback REST
      try {
        await api.cancelRequest(requestId);
        get().cleanup(true);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  /**
   * Fetch request history for a user
   */
  fetchHistory: async (userId, role) => {
    set({ isLoading: true });

    if (USE_FIREBASE_FIRESTORE) {
      try {
        const q = query(
          collection(db, 'requests'),
          where(role === 'mechanic' ? 'mechanicId' : 'customerId', '==', userId)
        );
        const snapshot = await getDocs(q);
        const HISTORY_STATUSES = ['completed', 'cancelled', 'expired'];
        
        const history = snapshot.docs
          .map(docSnap => {
            const r = docSnap.data();
            return {
              id: docSnap.id,
              uid: docSnap.id,
              ...r,
              createdAt: r.createdAt ? { seconds: r.createdAt.seconds } : null,
            };
          })
          .filter(r => HISTORY_STATUSES.includes(r.status));

        history.sort((a, b) => {
          const secA = a.createdAt?.seconds || (a.createdAt?.toMillis ? a.createdAt.toMillis() / 1000 : 0) || 0;
          const secB = b.createdAt?.seconds || (b.createdAt?.toMillis ? b.createdAt.toMillis() / 1000 : 0) || 0;
          return secB - secA;
        });

        set({ requestHistory: history, isLoading: false });
        return history;
      } catch (error) {
        console.error('Firebase fetchHistory error:', error);
        set({ isLoading: false });
        return [];
      }
    } else {
      // Fallback REST
      try {
        const response = await api.getRequestHistory(userId, role);
        const history = response.data.map(r => ({
          ...r,
          uid: r.id.toString(),
          createdAt: r.createdAt ? { seconds: new Date(r.createdAt).getTime() / 1000 } : null,
        }));
        set({ requestHistory: history, isLoading: false });
        return history;
      } catch (error) {
        set({ isLoading: false });
        return [];
      }
    }
  },

  /**
   * Cleanup listeners and intervals
   */
  cleanup: (clearActive = false) => {
    // 1. Clear REST polling intervals
    const { intervals, unsubscribes } = get();
    Object.entries(intervals).forEach(([key, intervalId]) => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    });

    // 2. Unsubscribe from Firestore snapshot listeners
    Object.entries(unsubscribes).forEach(([key, unsub]) => {
      if (unsub) {
        unsub();
      }
    });

    const newState = { 
      intervals: {}, 
      unsubscribes: {},
      nearbyRequests: [], 
      onlineMechanics: [] 
    };

    if (clearActive) {
      newState.activeRequest = null;
    }

    set(newState);
  },
  
  /**
   * Listen to real-time request history for a user (onSnapshot)
   */
  listenToHistory: (userId, role) => {
    set({ isLoading: true });

    if (USE_FIREBASE_FIRESTORE) {
      const q = query(
        collection(db, 'requests'),
        where(role === 'mechanic' ? 'mechanicId' : 'customerId', '==', userId)
      );

      const unsub = onSnapshot(q, (snapshot) => {
        const HISTORY_STATUSES = ['completed', 'cancelled', 'expired'];
        const history = snapshot.docs
          .map(docSnap => {
            const r = docSnap.data();
            return {
              id: docSnap.id,
              uid: docSnap.id,
              ...r,
              createdAt: r.createdAt ? { seconds: r.createdAt.seconds } : null,
            };
          })
          .filter(r => HISTORY_STATUSES.includes(r.status));

        history.sort((a, b) => {
          const secA = a.createdAt?.seconds || (a.createdAt?.toMillis ? a.createdAt.toMillis() / 1000 : 0) || 0;
          const secB = b.createdAt?.seconds || (b.createdAt?.toMillis ? b.createdAt.toMillis() / 1000 : 0) || 0;
          return secB - secA;
        });

        set({ requestHistory: history, isLoading: false });
      }, (error) => {
        console.error('Firebase listenToHistory error:', error);
        set({ isLoading: false });
      });

      set(state => ({
        unsubscribes: { ...state.unsubscribes, history: unsub }
      }));

      return unsub;
    } else {
      // Fallback REST polling
      const poll = async () => {
        try {
          const response = await api.getRequestHistory(userId, role);
          const history = response.data.map(r => ({
            ...r,
            uid: r.id.toString(),
            createdAt: r.createdAt ? { seconds: new Date(r.createdAt).getTime() / 1000 } : null,
          }));
          set({ requestHistory: history, isLoading: false });
        } catch (e) {
          console.error(e);
        }
      };
      poll();
      const intervalId = setInterval(poll, 8000);
      set(state => ({
        intervals: { ...state.intervals, history: intervalId }
      }));
      return () => clearInterval(intervalId);
    }
  },

  /**
   * Submit a rating
   */
  submitRating: async (requestId, mechanicId, ratingData) => {
    set({ isLoading: true });
    if (USE_FIREBASE_FIRESTORE) {
      try {
        await updateDoc(doc(db, 'requests', requestId), {
          rating: ratingData.score,
          ratingComment: ratingData.comment || '',
          reviewedAt: serverTimestamp(),
          driverAcknowledged: true
        });

        // Also update mechanic's running rating
        if (mechanicId) {
          const mechRef = doc(db, 'mechanics', mechanicId);
          const mechSnap = await getDoc(mechRef);
          if (mechSnap.exists()) {
            const mData = mechSnap.data();
            const currentRating = mData.rating || 5.0;
            const currentCount = mData.totalReviews || 0;
            const newRating = parseFloat(((currentRating * currentCount + ratingData.score) / (currentCount + 1)).toFixed(2));
            await setDoc(mechRef, { 
              rating: newRating, 
              totalReviews: currentCount + 1 
            }, { merge: true });
          }
        }
        set({ isLoading: false });
        return { success: true };
      } catch (error) {
        console.error('Firebase submitRating error:', error);
        set({ isLoading: false });
        return { success: false, error: error.message };
      }
    } else {
      set({ isLoading: false });
      return { success: true };
    }
  },
}));

export default useRequestStore;
