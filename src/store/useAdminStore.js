/**
 * Admin Store — Zustand
 * Exclusive data access for the App Owner
 */
import { create } from 'zustand';
import { 
  collection, 
  getDocs, 
  query, 
  onSnapshot, 
  where,
  orderBy 
} from 'firebase/firestore';
import { db } from '../services/firebase';

const useAdminStore = create((set, get) => ({
  allRequests: [],
  allUsers: [],
  stats: {
    totalRevenue: 0,
    totalJobs: 0,
    activeJobs: 0,
    mechanicsOnline: 0
  },
  isLoading: false,
  unsubscribe: null,

  /**
   * Listen to all requests in the system
   */
  listenToAllRequests: () => {
    set({ isLoading: true });
    const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Calculate Stats
      const revenue = requests
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + (r.estimatedCost || 0), 0);
      
      const active = requests.filter(r => ['pending', 'accepted', 'in_progress'].includes(r.status)).length;

      set({ 
        allRequests: requests,
        stats: {
          ...get().stats,
          totalRevenue: revenue,
          totalJobs: requests.length,
          activeJobs: active
        },
        isLoading: false 
      });
    });

    set({ unsubscribe: unsub });
  },

  /**
   * Fetch all users (Mechanics and Customers)
   */
  fetchAllUsers: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const mechanicsOnline = users.filter(u => u.role === 'mechanic' && u.isOnline).length;
      
      set({ 
        allUsers: users,
        stats: {
          ...get().stats,
          mechanicsOnline
        }
      });
    } catch (error) {
      console.error('Fetch all users error:', error);
    }
  },

  /**
   * Cleanup listeners
   */
  cleanup: () => {
    const { unsubscribe } = get();
    if (unsubscribe) unsubscribe();
    set({ unsubscribe: null });
  }
}));

export default useAdminStore;
