import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  orderBy,
  arrayUnion 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { logAdminActivity } from '../services/adminAuthService';
import { registerAdminListener, unregisterAdminListener } from '../services/adminListenerRegistry';

export const useAdminChat = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to all active requests that contain a lastMessageText
    const q = query(collection(db, 'requests'));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .filter((req) => req.lastMessageText !== undefined || req.status === 'accepted' || req.status === 'in_progress');

      // Sort chats by last active message
      list.sort((a, b) => {
        const aTime = a.lastMessageTime?.seconds || a.createdAt?.seconds || 0;
        const bTime = b.lastMessageTime?.seconds || b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      setChats(list);
      setLoading(false);
    }, (error) => {
      console.error('Chats monitoring listener error:', error);
      setLoading(false);
    });

    registerAdminListener('useAdminChat_listener', unsub);

    return () => {
      unsub();
      unregisterAdminListener('useAdminChat_listener');
    };
  }, []);

  const flagMessage = async (requestId, messageId, reason, adminUserId) => {
    const requestRef = doc(db, 'requests', requestId);
    const newFlag = {
      messageId,
      reason,
      flaggedBy: adminUserId,
      timestamp: new Date().toISOString()
    };

    await updateDoc(requestRef, {
      flaggedMessages: arrayUnion(newFlag)
    });

    await logAdminActivity(adminUserId, 'FLAG_MESSAGE_ABUSE', { requestId, messageId, reason });
  };

  const deleteMessage = async (requestId, messageId, adminUserId) => {
    const msgRef = doc(db, 'requests', requestId, 'messages', messageId);
    // Instead of actual destructive deletion, set a moderation flag to preserve evidence
    await updateDoc(msgRef, {
      text: '[This message was removed by moderator review]',
      isModerated: true,
      moderatedAt: serverTimestamp(),
      moderatedBy: adminUserId
    });
    
    await logAdminActivity(adminUserId, 'MODERATE_DELETE_MESSAGE', { requestId, messageId });
  };

  return {
    chats,
    loading,
    flagMessage,
    deleteMessage
  };
};

export const subscribeToRequestMessages = (requestId, onUpdate) => {
  const q = query(
    collection(db, 'requests', requestId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  const unsub = onSnapshot(q, (snapshot) => {
    onUpdate(snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));
  }, (error) => {
    console.error(`Error subscribing to messages for request ${requestId}:`, error);
    onUpdate([]);
  });

  // Dynamically register the message subscription to prevent memory leaks if pages are nested
  registerAdminListener(`chat_messages_${requestId}`, unsub);

  return () => {
    unsub();
    unregisterAdminListener(`chat_messages_${requestId}`);
  };
};
