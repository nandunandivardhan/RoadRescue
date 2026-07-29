/**
 * User Store — Zustand
 * Manages authentication state, user profile, and role via Firebase Auth & Firestore / Spring Boot REST API
 */
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import * as api from '../services/api';
import { 
  USE_FIREBASE_AUTH, 
  USE_FIREBASE_FIRESTORE,
  db,
  loginWithEmail as fbLoginWithEmail,
  registerWithEmail as fbRegisterWithEmail,
  loginWithGoogle as fbLoginWithGoogle,
  logout as fbLogout,
  subscribeToAuth
} from '../services/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  addDoc,
  getDocs,
  deleteDoc
} from 'firebase/firestore';

const useUserStore = create((set, get) => ({
  // State
  user: null,              // Mocked user object containing uid/email for screen compatibility
  profile: null,           // User profile containing id, uid, name, email, role, phone, etc.
  role: null,              // 'customer' or 'mechanic'
  isAuthenticated: false,
  isLoading: true,
  isProfileLoading: false,
  error: null,
  pushToken: null,
  emergencyContacts: [],

  // Actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setPushToken: (token) => set({ pushToken: token }),

  /**
   * Listen / restore auth state on app startup
   */
  initAuthListener: () => {
    set({ isLoading: true });

    if (USE_FIREBASE_AUTH) {
      // Real-time Firebase Authentication listener
      const unsub = subscribeToAuth(async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
              const data = userDoc.data();
              const role = (data.role || 'customer').toLowerCase();

              let mechanicVerified = false;

              // Check mechanic status from mechanics collection
              if (role === 'mechanic') {
                const mechSnap = await getDoc(doc(db, 'mechanics', firebaseUser.uid));
                let isApproved = false;
                let isSuspended = false;
                let isRejected = false;

                if (mechSnap.exists()) {
                  const mData = mechSnap.data();
                  const status = mData.status || 'pending_approval';
                  mechanicVerified = mData.verified || false;

                  isApproved = mData.approved === true || mData.isApproved === true || status === 'active' || status === 'approved';
                  isSuspended = mData.suspended === true || status === 'suspended';
                  isRejected = mData.approved === false || status === 'rejected';

                  // Handle automatic suspension expiry
                  if (isSuspended && mData.suspendedUntil) {
                    const expiry = new Date(mData.suspendedUntil);
                    if (Date.now() > expiry.getTime()) {
                      isApproved = true;
                      isSuspended = false;
                      await updateDoc(doc(db, 'mechanics', firebaseUser.uid), {
                        status: 'approved',
                        approved: true,
                        suspendedUntil: null,
                        suspensionReason: null,
                        suspendedBy: null
                      });
                    }
                  }
                } else {
                  // Initialize mechanic doc as pending_approval
                  isApproved = false;
                  await setDoc(doc(db, 'mechanics', firebaseUser.uid), {
                    userId: firebaseUser.uid,
                    specialty: 'flat_tire',
                    experienceYears: 5,
                    rating: 5.0,
                    status: 'pending_approval',
                    isOnline: false,
                    isAvailable: false,
                    latitude: 28.4595,
                    longitude: 77.0266,
                    lastLocationUpdate: serverTimestamp()
                  }, { merge: true });
                }

                // Enforce approval & suspension block rules
                if (isSuspended) {
                  Alert.alert(
                    'Access Denied',
                    'Your mechanic account is currently suspended by a RoadRescue administrator.'
                  );
                  await fbLogout();
                  set({ user: null, profile: null, role: null, isAuthenticated: false, isLoading: false });
                  return;
                } else if (isRejected) {
                  Alert.alert(
                    'Access Denied',
                    'Your mechanic registration credentials were rejected.'
                  );
                  await fbLogout();
                  set({ user: null, profile: null, role: null, isAuthenticated: false, isLoading: false });
                  return;
                } else if (!isApproved) {
                  Alert.alert(
                    'Access Denied',
                    'Your mechanic registration credentials are currently pending review.'
                  );
                  await fbLogout();
                  set({ user: null, profile: null, role: null, isAuthenticated: false, isLoading: false });
                  return;
                }
              }

              const profile = {
                id: firebaseUser.uid,
                uid: firebaseUser.uid,
                name: data.name || firebaseUser.displayName || 'RoadRescue User',
                email: data.email || firebaseUser.email,
                role: role,
                phone: data.phone || firebaseUser.phoneNumber || '',
                phoneNumber: data.phone || firebaseUser.phoneNumber || '',
                avatarUrl: data.avatarUrl || firebaseUser.photoURL || '',
                isOnline: data.isOnline || false,
                isAvailable: data.isAvailable || false,
                verified: mechanicVerified
              };

              set({
                user: { uid: firebaseUser.uid, email: firebaseUser.email },
                profile,
                role: profile.role,
                isAuthenticated: true,
                isLoading: false
              });

              // Mark approved mechanic online automatically on app load
              if (profile.role === 'mechanic') {
                try {
                  await updateDoc(doc(db, 'mechanics', firebaseUser.uid), {
                    isOnline: true,
                    isAvailable: true,
                    lastLocationUpdate: serverTimestamp()
                  });
                } catch (e) {
                  console.error('Failed to mark mechanic online:', e);
                }
              }
            } else {
              // Firebase Auth user exists but no Firestore profile document yet
              set({
                user: { uid: firebaseUser.uid, email: firebaseUser.email },
                profile: null,
                role: null,
                isAuthenticated: false,
                isLoading: false
              });
            }
          } catch (e) {
            console.error('Failed to load Firestore profile:', e);
            set({ isLoading: false });
          }
        } else {
          set({ user: null, profile: null, role: null, isAuthenticated: false, isLoading: false });
        }
      });
      return unsub;
    } else {
      // Fallback: Restore Session from local REST credentials
      const restore = async () => {
        try {
          const token = await AsyncStorage.getItem('jwt_token');
          const savedProfileStr = await AsyncStorage.getItem('user_profile');
          
          if (token && savedProfileStr) {
            const savedProfile = JSON.parse(savedProfileStr);
            const profile = {
              ...savedProfile,
              id: savedProfile.id,
              uid: savedProfile.id.toString(), 
            };
            const role = profile.role.toLowerCase() === 'mechanic' ? 'mechanic' : 'customer';

            set({
              user: { uid: profile.uid, email: profile.email },
              profile: profile,
              role: role,
              isAuthenticated: true,
              isLoading: false,
            });

            if (role === 'mechanic') {
              api.updateMechanicStatus(profile.id, true, true).catch(() => {});
            }
          } else {
            set({ user: null, profile: null, role: null, isAuthenticated: false, isLoading: false });
          }
        } catch (e) {
          console.error('Session restoration failed:', e);
          set({ user: null, profile: null, role: null, isAuthenticated: false, isLoading: false });
        }
      };
      restore();
      return () => {};
    }
  },

  /**
   * Register a new user
   */
  register: async (email, password, name, role, phoneNumber = '', specialty = 'flat_tire', experienceYears = 5) => {
    set({ isLoading: true, error: null });
    
    if (USE_FIREBASE_AUTH) {
      try {
        const credentials = await fbRegisterWithEmail(email, password);
        const firebaseUser = credentials.user;

        const profile = {
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          name,
          email,
          role: role.toLowerCase(),
          roles: [role.toLowerCase()],
          phone: phoneNumber,
          phoneNumber: phoneNumber,
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FF6B35&color=fff`,
          createdAt: serverTimestamp()
        };

        // 1. Write users collection
        await setDoc(doc(db, 'users', firebaseUser.uid), profile, { merge: true });

        // 2. Write mechanics collection if role is mechanic
        if (profile.role === 'mechanic') {
          await setDoc(doc(db, 'mechanics', firebaseUser.uid), {
            userId: firebaseUser.uid,
            specialty,
            experienceYears: parseInt(experienceYears) || 5,
            rating: 5.0,
            isOnline: true,
            isAvailable: true,
            latitude: 28.4595,
            longitude: 77.0266,
            lastLocationUpdate: serverTimestamp()
          }, { merge: true });
        }

        set({
          user: { uid: firebaseUser.uid, email },
          profile,
          role: profile.role,
          isAuthenticated: true,
          isLoading: false
        });

        return { success: true };
      } catch (error) {
        console.error('Firebase Registration error:', error);
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }
    } else {
      // Fallback to Spring Boot
      try {
        const payload = {
          name,
          email,
          password,
          phone: phoneNumber,
          role: role.toUpperCase(), // "USER" or "MECHANIC"
        };

        const response = await api.register(payload);
        const data = response.data;

        const profile = {
          ...data,
          id: data.id,
          uid: data.id.toString(),
          phoneNumber: data.phone,
          role: data.role.toLowerCase(),
        };

        await AsyncStorage.setItem('jwt_token', data.token);
        await AsyncStorage.setItem('user_profile', JSON.stringify(profile));

        set({
          user: { uid: profile.uid, email: profile.email },
          profile,
          role: profile.role,
          isAuthenticated: true,
          isLoading: false,
        });

        return { success: true };
      } catch (error) {
        console.error('Registration error:', error);
        const msg = error.response?.data?.message || error.message || 'Registration failed';
        set({ isLoading: false, error: msg });
        return { success: false, error: msg };
      }
    }
  },

  /**
   * Sign in existing user
   */
  login: async (email, password) => {
    set({ isLoading: true, error: null });

    if (USE_FIREBASE_AUTH) {
      try {
        await fbLoginWithEmail(email, password);
        // Auth listener subscribeToAuth handles the profile fetching and loading switch automatically
        return { success: true };
      } catch (error) {
        console.error('Firebase Login error:', error);
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }
    } else {
      // Fallback to Spring Boot
      try {
        const response = await api.login(email, password);
        const data = response.data;

        const profile = {
          ...data,
          id: data.id,
          uid: data.id.toString(),
          phoneNumber: data.phone,
          role: data.role.toLowerCase(),
        };

        await AsyncStorage.setItem('jwt_token', data.token);
        await AsyncStorage.setItem('user_profile', JSON.stringify(profile));

        set({
          user: { uid: profile.uid, email: profile.email },
          profile,
          role: profile.role,
          isAuthenticated: true,
          isLoading: false,
        });

        return { success: true };
      } catch (error) {
        console.error('Login error:', error);
        const msg = error.response?.data?.message || error.message || 'Invalid email or password';
        set({ isLoading: false, error: msg });
        return { success: false, error: msg };
      }
    }
  },

  /**
   * Google sign in
   */
  loginWithGoogle: async (role, tokenData = null) => {
    set({ isLoading: true, error: null });
    
    if (USE_FIREBASE_AUTH) {
      try {
        const credentials = await fbLoginWithGoogle(tokenData?.idToken);
        const firebaseUser = credentials.user;

        // Fetch user from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        let profile;
        if (userDoc.exists()) {
          const data = userDoc.data();
          profile = {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            name: data.name || firebaseUser.displayName || 'RoadRescue User',
            email: firebaseUser.email,
            role: (data.role || role || 'customer').toLowerCase(),
            phone: data.phone || firebaseUser.phoneNumber || '',
            phoneNumber: data.phone || firebaseUser.phoneNumber || '',
            avatarUrl: data.avatarUrl || firebaseUser.photoURL || ''
          };
        } else {
          // If first time sign-in, create a profile document
          profile = {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'RoadRescue User',
            email: firebaseUser.email,
            role: (role || 'customer').toLowerCase(),
            phone: firebaseUser.phoneNumber || '',
            phoneNumber: firebaseUser.phoneNumber || '',
            avatarUrl: firebaseUser.photoURL || '',
            createdAt: serverTimestamp()
          };
          
          await setDoc(userDocRef, profile, { merge: true });

          if (profile.role === 'mechanic') {
            const mechRef = doc(db, 'mechanics', firebaseUser.uid);
            const mechSnap = await getDoc(mechRef);
            if (!mechSnap.exists()) {
              await setDoc(mechRef, {
                userId: firebaseUser.uid,
                specialty: 'flat_tire',
                experienceYears: 5,
                rating: 5.0,
                status: 'pending_approval',
                isOnline: true,
                isAvailable: true,
                latitude: 28.4595,
                longitude: 77.0266,
                lastLocationUpdate: serverTimestamp()
              }, { merge: true });
            }
          }
        }

        set({
          user: { uid: firebaseUser.uid, email: firebaseUser.email },
          profile,
          role: profile.role,
          isAuthenticated: true,
          isLoading: false
        });

        return { success: true };
      } catch (error) {
        console.error('Firebase Google Sign-In error:', error);
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }
    } else {
      // Mock Google login for non-firebase stack compatibility
      set({ isLoading: false });
      return { success: true };
    }
  },

  /**
   * Sign out
   */
  logout: async () => {
    const { profile } = get();

    if (USE_FIREBASE_AUTH) {
      try {
        if (profile && profile.role === 'mechanic') {
          // Set mechanic offline on sign out
          try {
            await updateDoc(doc(db, 'mechanics', profile.uid), {
              isOnline: false,
              isAvailable: false,
              lastLocationUpdate: serverTimestamp()
            });
          } catch (e) {}
        }
        
        await fbLogout();
        set({ user: null, profile: null, role: null, isAuthenticated: false, error: null });
      } catch (error) {
        console.error('Firebase Logout error:', error);
      }
    } else {
      // Fallback: Sign out REST
      try {
        if (profile && profile.role === 'mechanic') {
          try {
            await api.updateMechanicStatus(profile.id, false, false);
          } catch (e) {}
        }
        
        await AsyncStorage.removeItem('jwt_token');
        await AsyncStorage.removeItem('user_profile');
        
        set({
          user: null,
          profile: null,
          role: null,
          isAuthenticated: false,
          error: null,
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (updates) => {
    const { profile } = get();
    if (!profile) return false;

    if (USE_FIREBASE_AUTH) {
      try {
        await updateDoc(doc(db, 'users', profile.uid), updates);
        
        // Also update mechanics collection if role is mechanic
        if (profile.role === 'mechanic') {
          const mechUpdates = {};
          if (updates.specialty) mechUpdates.specialty = updates.specialty;
          if (updates.name) mechUpdates.name = updates.name;
          if (updates.phone) mechUpdates.phone = updates.phone;
          
          if (Object.keys(mechUpdates).length > 0) {
            try {
              await updateDoc(doc(db, 'mechanics', profile.uid), mechUpdates);
            } catch (e) {
              console.error('Failed to update mechanics collection:', e);
            }
          }
        }
        
        set({ profile: { ...profile, ...updates } });
        return true;
      } catch (error) {
        console.error('Firestore Profile update error:', error);
        return false;
      }
    } else {
      // Fallback REST
      try {
        const updatedProfile = { ...profile, ...updates };
        await AsyncStorage.setItem('user_profile', JSON.stringify(updatedProfile));
        set({ profile: updatedProfile });
        return true;
      } catch (error) {
        console.error('Profile update error:', error);
        return false;
      }
    }
  },

  /**
   * Fetch Emergency Contacts
   */
  fetchEmergencyContacts: async () => {
    const { profile } = get();
    if (!profile?.uid) return;
    
    try {
      if (USE_FIREBASE_FIRESTORE) {
        const querySnapshot = await getDocs(collection(db, 'users', profile.uid, 'emergencyContacts'));
        const contacts = querySnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        set({ emergencyContacts: contacts });
      } else {
        set({ emergencyContacts: [] });
      }
    } catch (error) {
      console.error('[EmergencyContacts] Failed to fetch emergency contacts:', error);
    }
  },

  addEmergencyContact: async (contact) => {
    const { profile } = get();
    if (!profile?.uid) return { success: false, error: 'User not logged in' };
    
    try {
      if (USE_FIREBASE_FIRESTORE) {
        const docRef = await addDoc(collection(db, 'users', profile.uid, 'emergencyContacts'), {
          name: contact.name,
          phone: contact.phone,
          createdAt: serverTimestamp()
        });
        
        // Return a mock local item to instantly update state (Requirement 2)
        const newContact = {
          id: docRef.id,
          name: contact.name,
          phone: contact.phone,
          createdAt: new Date().toISOString()
        };
        
        const current = get().emergencyContacts || [];
        set({ emergencyContacts: [...current, newContact] });
        
        // Asynchronously sync with DB to populate Firestore server timestamps
        get().fetchEmergencyContacts().catch(err => {
          console.error('[EmergencyContacts] Background fetch failed:', err);
        });
        
        return { success: true };
      } else {
        return { success: true };
      }
    } catch (error) {
      console.error('[EmergencyContacts] Failed to add emergency contact:', error);
      return { success: false, error: error.message };
    }
  },

  removeEmergencyContact: async (contactId) => {
    const { profile } = get();
    if (!profile?.uid) return { success: false, error: 'User not logged in' };
    
    try {
      if (USE_FIREBASE_FIRESTORE) {
        await deleteDoc(doc(db, 'users', profile.uid, 'emergencyContacts', contactId));
        
        // Instantly update local Zustand state (Requirement 2)
        const current = get().emergencyContacts || [];
        set({ emergencyContacts: current.filter(c => c.id !== contactId) });
        
        // Asynchronously sync with DB
        get().fetchEmergencyContacts().catch(err => {
          console.error('[EmergencyContacts] Background fetch failed:', err);
        });
        
        return { success: true };
      } else {
        return { success: true };
      }
    } catch (error) {
      console.error('[EmergencyContacts] Failed to remove emergency contact:', error);
      return { success: false, error: error.message };
    }
  },
}));

export default useUserStore;
