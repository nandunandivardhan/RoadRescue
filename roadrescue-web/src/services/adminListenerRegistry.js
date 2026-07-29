/**
 * Isolated Global listener registry utility for RoadRescue Admin System
 * Tracks active Firestore onSnapshot listeners to guarantee no leakage on logout or auth failure.
 */

if (typeof window !== 'undefined') {
  window.globalListenerRegistry = window.globalListenerRegistry || {};
}

/**
 * Register a listener's unsubscribe callback
 * @param {string} key Unique identifier for the listener
 * @param {function} unsubscribe Unsubscribe function returned by onSnapshot
 */
export const registerAdminListener = (key, unsubscribe) => {
  if (typeof window === 'undefined' || !key || typeof unsubscribe !== 'function') return;

  // Unsubscribe existing if any duplicate registration happens
  if (window.globalListenerRegistry[key]) {
    try {
      window.globalListenerRegistry[key]();
    } catch (e) {
      console.error(`[ListenerRegistry] Error cleaning up duplicate listener for ${key}:`, e);
    }
  }

  window.globalListenerRegistry[key] = unsubscribe;
  console.log(`[ListenerRegistry] Registered active admin listener: "${key}"`);
};

/**
 * Unsubscribe and remove a listener from the registry
 * @param {string} key Unique identifier for the listener
 */
export const unregisterAdminListener = (key) => {
  if (typeof window === 'undefined' || !key) return;

  if (window.globalListenerRegistry[key]) {
    try {
      window.globalListenerRegistry[key]();
      console.log(`[ListenerRegistry] Unsubscribed active admin listener: "${key}"`);
    } catch (e) {
      console.error(`[ListenerRegistry] Error unsubscribing listener ${key}:`, e);
    }
    delete window.globalListenerRegistry[key];
  }
};

/**
 * Unsubscribe from ALL registered administrative listeners
 */
export const clearAllAdminListeners = () => {
  if (typeof window === 'undefined' || !window.globalListenerRegistry) return;

  console.log('[ListenerRegistry] Cleaning up ALL active administrative listeners...');
  Object.keys(window.globalListenerRegistry).forEach((key) => {
    try {
      if (typeof window.globalListenerRegistry[key] === 'function') {
        window.globalListenerRegistry[key]();
        console.log(`[ListenerRegistry] Unsubscribed: "${key}"`);
      }
    } catch (e) {
      console.error(`[ListenerRegistry] Error cleaning up listener ${key}:`, e);
    }
    delete window.globalListenerRegistry[key];
  });
};
