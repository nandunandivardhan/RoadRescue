import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { registerAdminListener, unregisterAdminListener } from '../services/adminListenerRegistry';

export const useAdminMetrics = () => {
  const [metrics, setMetrics] = useState({
    activeRequests: 0,
    activeSOS: 0,
    totalCustomers: 0,
    activeMechanics: 0,
    averageRating: 0.0,
    activeSOSList: [],
    onlineMechanicsCount: 0,
    offlineMechanicsCount: 0,
    suspendedMechanicsCount: 0,
    topMechanics: [],
    systemHealth: 'green', // green | yellow | red
    lastSync: new Date().toISOString()
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Listen to active requests (status != "completed" and status != "cancelled")
    const requestsQuery = query(
      collection(db, 'requests')
    );

    const unsubRequests = onSnapshot(requestsQuery, (snapshot) => {
      let activeCount = 0;
      let sosCount = 0;
      const sosList = [];

      snapshot.docs.forEach((docSnap) => {
        const req = docSnap.data();
        const reqId = docSnap.id;
        const status = req.status || '';
        
        // Active requests
        if (status !== 'completed' && status !== 'reviewed' && status !== 'closed' && status !== 'cancelled' && status !== 'expired') {
          activeCount++;
          if (req.isSOS === true || req.priority === 'SOS' || req.priority === 'sos' || req.priority === 'emergency') {
            sosCount++;
            sosList.push({ id: reqId, ...req });
          }
        }
      });

      setMetrics((prev) => ({
        ...prev,
        activeRequests: activeCount,
        activeSOS: sosCount,
        activeSOSList: sosList,
        lastSync: new Date().toISOString()
      }));
    }, (error) => {
      console.error("Requests listener error:", error);
      setMetrics((prev) => ({ ...prev, systemHealth: 'yellow' }));
    });

    registerAdminListener('useAdminMetrics_requests', unsubRequests);

    // 2. Listen to online mechanics status and ratings
    const mechanicsQuery = query(collection(db, 'mechanics'));
    
    const unsubMechanics = onSnapshot(mechanicsQuery, (snapshot) => {
      let online = 0;
      let offline = 0;
      let suspended = 0;
      let sumRating = 0;
      let ratingCount = 0;
      const mechs = [];

      snapshot.docs.forEach((docSnap) => {
        const mech = docSnap.data();
        const status = mech.status || '';
        
        if (status === 'suspended') {
          suspended++;
        } else if (mech.isOnline === true) {
          online++;
        } else {
          offline++;
        }

        const rating = parseFloat(mech.rating) || 0;
        if (rating > 0) {
          sumRating += rating;
          ratingCount++;
        }

        mechs.push({ id: docSnap.id, ...mech });
      });

      // Sort mechanics by rating to get top mechanics
      mechs.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
      const top5 = mechs.slice(0, 5);

      const avgRating = ratingCount > 0 ? (sumRating / ratingCount) : 5.0;

      setMetrics((prev) => ({
        ...prev,
        activeMechanics: online,
        onlineMechanicsCount: online,
        offlineMechanicsCount: offline,
        suspendedMechanicsCount: suspended,
        averageRating: Math.round(avgRating * 100) / 100,
        topMechanics: top5,
        lastSync: new Date().toISOString()
      }));
    }, (error) => {
      console.error("Mechanics listener error:", error);
      setMetrics((prev) => ({ ...prev, systemHealth: 'yellow' }));
    });

    registerAdminListener('useAdminMetrics_mechanics', unsubMechanics);

    // 3. Listen to users to count customers
    const usersQuery = query(collection(db, 'users'));
    
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      let customers = 0;
      snapshot.docs.forEach((docSnap) => {
        const userData = docSnap.data();
        const roles = userData.roles || [];
        const role = userData.role || '';
        
        if (roles.includes('customer') || role === 'customer' || role === 'user' || roles.includes('user')) {
          customers++;
        }
      });

      setMetrics((prev) => ({
        ...prev,
        totalCustomers: customers,
        lastSync: new Date().toISOString()
      }));
      setLoading(false);
    }, (error) => {
      console.error("Users listener error:", error);
      setMetrics((prev) => ({ ...prev, systemHealth: 'yellow' }));
      setLoading(false);
    });

    registerAdminListener('useAdminMetrics_users', unsubUsers);

    return () => {
      unsubRequests();
      unsubMechanics();
      unsubUsers();
      unregisterAdminListener('useAdminMetrics_requests');
      unregisterAdminListener('useAdminMetrics_mechanics');
      unregisterAdminListener('useAdminMetrics_users');
    };
  }, []);

  return { metrics, loading };
};
