/**
 * Chat Store — Zustand
 * Manages real-time messaging between Customer and Mechanic
 */
import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../services/firebase';

const useChatStore = create((set, get) => ({
  messages: [],
  isLoading: false,
  unsubscribe: null,

  /**
   * Listen to messages for a specific request
   */
  listenToMessages: (requestId) => {
    set({ isLoading: true });
    
    const q = query(
      collection(db, 'requests', requestId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamp to Date for UI
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      set({ messages: msgs, isLoading: false });
    });

    set({ unsubscribe: unsub });
    return unsub;
  },

  /**
   * Send a new message
   */
  sendMessage: async (requestId, messageData) => {
    try {
      await addDoc(collection(db, 'requests', requestId, 'messages'), {
        text: messageData.text,
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        createdAt: serverTimestamp(),
        type: 'text',
      });
      return { success: true };
    } catch (error) {
      console.error('Send message error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Cleanup listener
   */
  cleanupChat: () => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
      set({ unsubscribe: null, messages: [] });
    }
  }
}));

export default useChatStore;
