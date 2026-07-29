import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { registerAdminListener, unregisterAdminListener } from '../services/adminListenerRegistry';

export const useAdminLiveMap = () => {
  const [mechanics, setMechanics] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Listen to all online mechanics in real-time
    const mechQuery = query(
      collection(db, 'mechanics'),
      where('isOnline', '==', true)
    );

    const unsubMechs = onSnapshot(mechQuery, async (snapshot) => {
      const list = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        let name = 'Certified Rescue Partner';
        let phone = '';

        try {
          const userDoc = await getDoc(doc(db, 'users', docSnap.id));
          if (userDoc.exists()) {
            name = userDoc.data().name || name;
            phone = userDoc.data().phone || phone;
          }
        } catch (e) {}

        // Verify latitude and longitude exist before mapping
        const lat = parseFloat(data.latitude) || parseFloat(data.currentLocation?.lat) || parseFloat(data.currentLocation?.latitude) || 28.4595;
        const lng = parseFloat(data.longitude) || parseFloat(data.currentLocation?.lng) || parseFloat(data.currentLocation?.longitude) || 77.0266;

        list.push({
          id: docSnap.id,
          name,
          phone,
          lat,
          lng,
          ...data
        });
      }
      setMechanics(list);
    }, (error) => {
      console.error('Map online mechanics listener error:', error);
    });

    registerAdminListener('useAdminLiveMap_mechanics', unsubMechs);

    // 2. Listen to active requests (status is not completed/cancelled/expired)
    const requestsQuery = query(
      collection(db, 'requests'),
      where('status', 'not-in', ['completed', 'reviewed', 'closed', 'cancelled', 'expired'])
    );

    const unsubReqs = onSnapshot(requestsQuery, (snapshot) => {
      const list = snapshot.docs.map((docSnap) => {
        const req = docSnap.data();
        const lat = parseFloat(req.pickupLatitude) || parseFloat(req.customerLocation?.lat) || parseFloat(req.customerLocation?.latitude) || 28.4595;
        const lng = parseFloat(req.pickupLongitude) || parseFloat(req.customerLocation?.lng) || parseFloat(req.customerLocation?.longitude) || 77.0266;
        
        // Mechanic coordinates if assigned and active
        const mechLat = parseFloat(req.mechanicLatitude) || parseFloat(req.mechanicLocation?.lat) || parseFloat(req.mechanicLocation?.latitude) || null;
        const mechLng = parseFloat(req.mechanicLongitude) || parseFloat(req.mechanicLocation?.lng) || parseFloat(req.mechanicLocation?.longitude) || null;

        return {
          id: docSnap.id,
          lat,
          lng,
          mechLat,
          mechLng,
          ...req
        };
      });
      setRequests(list);
      setLoading(false);
    }, (error) => {
      console.error('Map active requests listener error:', error);
      setLoading(false);
    });

    registerAdminListener('useAdminLiveMap_requests', unsubReqs);

    return () => {
      unsubMechs();
      unsubReqs();
      unregisterAdminListener('useAdminLiveMap_mechanics');
      unregisterAdminListener('useAdminLiveMap_requests');
    };
  }, []);

  return {
    mechanics,
    requests,
    loading
  };
};
