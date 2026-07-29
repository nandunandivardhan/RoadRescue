import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  addDoc,
  getDoc 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { logAdminActivity } from '../services/adminAuthService';
import { registerAdminListener, unregisterAdminListener } from '../services/adminListenerRegistry';

export const useAdminSOS = () => {
  const [activeSOSList, setActiveSOSList] = useState([]);
  const [onlineMechanics, setOnlineMechanics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Listen to active SOS and emergency requests in real-time
    const sosQuery = query(collection(db, 'requests'));

    const unsubSOS = onSnapshot(sosQuery, (snapshot) => {
      const list = [];
      snapshot.docs.forEach((docSnap) => {
        const req = docSnap.data();
        const isSOSRequest = req.isSOS === true || 
                             req.priority === 'SOS' || 
                             req.priority === 'sos' || 
                             req.priority === 'emergency' ||
                             req.priority === 'priority';
                             
        if (isSOSRequest) {
          list.push({ id: docSnap.id, ...req });
        }
      });
      // Sort SOS list by newest
      list.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      setActiveSOSList(list);
      setLoading(false);
    }, (error) => {
      console.error('SOS Listener error:', error);
      setLoading(false);
    });

    registerAdminListener('useAdminSOS_sos', unsubSOS);

    // 2. Listen to online mechanics for manual overrides
    const mechQuery = query(
      collection(db, 'mechanics'),
      where('isOnline', '==', true),
      where('isAvailable', '==', true)
    );

    const unsubMechs = onSnapshot(mechQuery, async (snapshot) => {
      const list = [];
      for (const docSnap of snapshot.docs) {
        const mech = docSnap.data();
        let name = 'Certified Rescue Partner';
        let phone = '';

        try {
          const userDoc = await getDoc(doc(db, 'users', docSnap.id));
          if (userDoc.exists()) {
            name = userDoc.data().name || name;
            phone = userDoc.data().phone || phone;
          }
        } catch (e) {}

        list.push({
          id: docSnap.id,
          name,
          phone,
          ...mech
        });
      }
      setOnlineMechanics(list);
    }, (error) => {
      console.error('Mechanics selector listener error:', error);
    });

    registerAdminListener('useAdminSOS_mechanics', unsubMechs);

    return () => {
      unsubSOS();
      unsubMechs();
      unregisterAdminListener('useAdminSOS_sos');
      unregisterAdminListener('useAdminSOS_mechanics');
    };
  }, []);

  const manualDispatch = async (requestId, mechanicId, adminUserId) => {
    // 1. Fetch mechanic details
    const mechUserDoc = await getDoc(doc(db, 'users', mechanicId));
    const mechUserData = mechUserDoc.exists() ? mechUserDoc.data() : {};

    const requestRef = doc(db, 'requests', requestId);
    await updateDoc(requestRef, {
      status: 'accepted',
      assignedMechanicId: mechanicId,
      mechanicId: mechanicId,
      mechanicName: mechUserData.name || 'Certified Rescue Partner',
      mechanicPhone: mechUserData.phone || '',
      dispatchedAt: serverTimestamp(),
      dispatchedBy: adminUserId
    });

    // 2. Set mechanic status to busy
    const mechRef = doc(db, 'mechanics', mechanicId);
    await updateDoc(mechRef, {
      isAvailable: false
    });

    // 3. Log chat system prompt
    try {
      await addDoc(collection(db, 'requests', requestId, 'messages'), {
        senderId: 'system',
        senderName: 'RoadRescue System',
        senderRole: 'system',
        text: `Urgent! Dispatch Override: Admin has manually allocated partner ${mechUserData.name || 'Certified Pro'} to this emergency.`,
        createdAt: serverTimestamp()
      });
    } catch (e) {}

    await logAdminActivity(adminUserId, 'SOS_MANUAL_DISPATCH', { requestId, mechanicId });
  };

  const escalateEmergency = async (requestId, type, adminUserId) => {
    const ref = doc(db, 'requests', requestId);
    await updateDoc(ref, {
      escalationStatus: type,
      escalatedAt: serverTimestamp(),
      escalatedBy: adminUserId
    });

    try {
      await addDoc(collection(db, 'requests', requestId, 'messages'), {
        senderId: 'system',
        senderName: 'RoadRescue System',
        senderRole: 'system',
        text: `Emergency Dispatch Alert: Admin has escalated this event to the ${type.toUpperCase()} authorities.`,
        createdAt: serverTimestamp()
      });
    } catch (e) {}

    await logAdminActivity(adminUserId, 'SOS_ESCALATE', { requestId, type });
  };

  const manuallyResolveSOS = async (requestId, reason, adminUserId) => {
    const requestSnap = await getDoc(doc(db, 'requests', requestId));
    const reqData = requestSnap.data() || {};
    const mechanicId = reqData.mechanicId || reqData.assignedMechanicId;

    const requestRef = doc(db, 'requests', requestId);
    await updateDoc(requestRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
      manualResolutionBy: adminUserId,
      manualResolutionReason: reason
    });

    // Release mechanic if assigned
    if (mechanicId) {
      const mechRef = doc(db, 'mechanics', mechanicId);
      await updateDoc(mechRef, {
        isAvailable: true
      });
    }

    try {
      await addDoc(collection(db, 'requests', requestId, 'messages'), {
        senderId: 'system',
        senderName: 'RoadRescue System',
        senderRole: 'system',
        text: `Emergency Resolved: Admin has manually resolved this emergency. Reason: ${reason}`,
        createdAt: serverTimestamp()
      });
    } catch (e) {}

    await logAdminActivity(adminUserId, 'SOS_MANUAL_RESOLVE', { requestId, reason });
  };

  return {
    activeSOSList,
    onlineMechanics,
    loading,
    manualDispatch,
    escalateEmergency,
    manuallyResolveSOS
  };
};
