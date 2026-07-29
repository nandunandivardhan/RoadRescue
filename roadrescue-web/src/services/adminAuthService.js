import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  writeBatch,
  serverTimestamp, 
  arrayUnion 
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { 
  SESSION_TOKEN_KEY, 
  SESSION_EXPIRY_KEY, 
  SESSION_EMAIL_KEY, 
  SESSION_ROLE_KEY 
} from './adminSessionKeys';
import { clearAllAdminListeners } from './adminListenerRegistry';

/**
 * Wait for Firebase Auth to initialize before validating session
 */
const waitForAuthInit = () => {
  return new Promise((resolve) => {
    if (auth.currentUser !== null) {
      resolve(auth.currentUser);
      return;
    }
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
    // Timeout fallback of 2 seconds
    setTimeout(() => {
      unsubscribe();
      resolve(auth.currentUser);
    }, 2000);
  });
};

/**
 * Log administrative operations into users/{adminUserId}.activityLog
 */
export const appendAdminActivityLog = async (adminId, action, details = {}) => {
  try {
    const userRef = doc(db, 'users', adminId);
    await writeBatch(db).update(userRef, {
      activityLog: arrayUnion({
        action,
        timestamp: new Date().toISOString(),
        details
      })
    }).commit();
  } catch (err) {
    console.error('[Auth] Failed to append admin activity log:', err);
  }
};

/**
 * Login administrative user
 */
export const loginAsAdmin = async (email, password) => {
  console.log('[AdminAuth] Initiating admin authentication for email:', email);
  
  // Step 3: Authenticate Firebase Auth user
  const credentials = await signInWithEmailAndPassword(auth, email, password);
  const firebaseUser = credentials.user;
  console.log('[AdminAuth] Firebase Auth successfully authenticated. UID:', firebaseUser.uid);

  // Step 4: Verify currentUser uid
  if (!firebaseUser.uid) {
    await firebaseSignOut(auth);
    throw new Error('Auth error: currentUser UID missing.');
  }

  // Step 5: Fetch users/{uid} and verify role
  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await firebaseSignOut(auth);
    throw new Error('User profile not found.');
  }

  const userData = userSnap.data();
  const userRoles = Array.isArray(userData.roles) ? userData.roles : [];
  const hasUserAdminRole = userRoles.includes('admin') || (typeof userData.role === 'string' && userData.role.toLowerCase() === 'admin');

  if (!hasUserAdminRole) {
    await firebaseSignOut(auth);
    throw new Error('Not authorized as admin.');
  }

  // Step 6: Fetch admins/{uid} record
  const adminRef = doc(db, 'admins', firebaseUser.uid);
  const adminSnap = await getDoc(adminRef);

  if (!adminSnap.exists()) {
    await firebaseSignOut(auth);
    throw new Error('Admin profile not found. Contact super admin.');
  }

  const adminData = adminSnap.data();
  if (typeof adminData.schemaVersion !== 'number' || adminData.schemaVersion < 1) {
    await firebaseSignOut(auth);
    throw new Error('Admin profile malformed. Contact super admin.');
  }

  if (adminData.status === 'suspended') {
    await firebaseSignOut(auth);
    throw new Error('Account suspended. Contact super admin.');
  }

  if (adminData.status !== 'active') {
    await firebaseSignOut(auth);
    throw new Error('Account inactive. Contact super admin.');
  }

  // Step 7: Update login timestamps and logs in background batch
  const batch = writeBatch(db);
  batch.update(adminRef, {
    lastLoginAt: serverTimestamp()
  });
  batch.update(userRef, {
    activityLog: arrayUnion({
      action: 'admin_login',
      timestamp: new Date().toISOString(),
      details: 'login'
    })
  });

  try {
    await batch.commit();
    console.log('[AdminAuth] Logged login timestamps to Firestore successfully.');
  } catch (err) {
    console.error('[AdminAuth] Firestore batch logging failed (non-blocking):', err);
  }

  // Step 8: Set session keys
  writeAdminSession(firebaseUser.uid, adminData);

  return adminData;
};

/**
 * Validate active administrative session
 */
export const validateAdminSession = async () => {
  // Step 1: Read token + expiry from localStorage
  const token = localStorage.getItem(SESSION_TOKEN_KEY);
  const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);

  if (!token || !expiry) {
    clearAdminSession();
    return false;
  }

  // Step 2: Check expiry
  if (Date.now() > parseInt(expiry, 10)) {
    clearAdminSession();
    return false;
  }

  // Step 3: Wait for Auth initialization and verify matching UID
  const currentUser = await waitForAuthInit();
  if (!currentUser) {
    clearAdminSession();
    return false;
  }

  if (currentUser.uid !== token) {
    clearAdminSession();
    return false;
  }

  // Step 4: Single Firestore read to verify admin status
  try {
    const adminRef = doc(db, 'admins', token);
    const adminSnap = await getDoc(adminRef);
    if (!adminSnap.exists()) {
      clearAdminSession();
      await firebaseSignOut(auth);
      return false;
    }
    const adminData = adminSnap.data();
    if (adminData.status !== 'active') {
      clearAdminSession();
      await firebaseSignOut(auth);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Auth] validateAdminSession Firestore read failed:', err);
    return false;
  }
};

/**
 * Write session markers to localStorage
 */
export const writeAdminSession = (uid, adminData) => {
  localStorage.setItem(SESSION_TOKEN_KEY,  uid);
  localStorage.setItem(SESSION_EXPIRY_KEY, String(Date.now() + 86400000));  // 24h
  localStorage.setItem(SESSION_EMAIL_KEY,  adminData.email ?? "");
  localStorage.setItem(SESSION_ROLE_KEY,   adminData.role ?? "admin");

  // Synchronize standard user profile with AuthContext so the sticky Navbar hydrates instantly
  const standardUserProfile = {
    id: uid,
    name: adminData.fullName || 'System Admin',
    email: adminData.email || '',
    role: 'ADMIN', // Capitalized for Navbar component checks
    phone: adminData.phoneNumber || '',
    avatarUrl: ''
  };
  localStorage.setItem('user', JSON.stringify(standardUserProfile));
  localStorage.setItem('jwt_token', uid);
};

/**
 * Clean up local storage administrative keys
 */
export const clearAdminSession = () => {
  [SESSION_TOKEN_KEY, SESSION_EXPIRY_KEY, SESSION_EMAIL_KEY, SESSION_ROLE_KEY]
    .forEach(k => localStorage.removeItem(k));

  // Clean up standard auth keys as well to prevent session collision
  try {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed.role === 'ADMIN') {
        localStorage.removeItem('user');
        localStorage.removeItem('jwt_token');
      }
    }
  } catch (e) {}
};

/**
 * Get the current active admin session (synchronously from localStorage for UI hydration)
 */
export const getAdminSession = () => {
  const token = localStorage.getItem(SESSION_TOKEN_KEY);
  const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);
  const email = localStorage.getItem(SESSION_EMAIL_KEY);
  const role = localStorage.getItem(SESSION_ROLE_KEY);

  if (!token || !expiry) {
    clearAdminSession();
    return null;
  }

  if (Date.now() > parseInt(expiry, 10)) {
    clearAdminSession();
    return null;
  }

  return {
    uid: token,
    email: email || '',
    role: role || 'admin',
    fullName: email ? email.split('@')[0] : 'System Admin'
  };
};

/**
 * Clean up all global listeners (to be populated or registered globally)
 */
export const cleanupAllListeners = () => {
  try {
    clearAllAdminListeners();
  } catch (e) {
    console.error('[Auth] Failed to clean up listeners through registry:', e);
  }
};

/**
 * Logs out from administrative panel
 */
export const logoutAdmin = async () => {
  console.log('[AdminAuth] Initiating clean admin logout...');
  try {
    cleanupAllListeners();
  } catch (e) {
    console.error('[Logout] listener cleanup error:', e);
  }
  try {
    clearAdminSession();
  } catch (e) {
    console.error('[Logout] session clear error:', e);
  }
  try {
    await firebaseSignOut(auth);
  } catch (e) {
    console.error('[Logout] firebase signOut error:', e);
  }
};

/**
 * Backward compatibility alias for hooks
 */
export const logAdminActivity = appendAdminActivityLog;
