import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  arrayUnion, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { logAdminActivity } from '../services/adminAuthService';

export const useAdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const querySnap = await getDocs(collection(db, 'users'));
      const list = [];

      for (const docSnap of querySnap.docs) {
        const userData = docSnap.data();
        const roles = userData.roles || [];
        const role = userData.role || '';

        // Filter only driver/customer users
        if (roles.includes('customer') || role === 'customer' || role === 'user' || roles.includes('user')) {
          // Count requests and SOS counts in requests collection
          let totalReqs = 0;
          let sosCount = 0;

          list.push({
            id: docSnap.id,
            fullName: userData.name || 'RoadRescue Customer',
            email: userData.email || '',
            phone: userData.phone || '',
            accountStatus: userData.accountStatus || 'active',
            warnings: userData.warnings || [],
            adminNotes: userData.adminNotes || '',
            createdAt: userData.createdAt,
            lastActive: userData.lastActive || userData.updatedAt || userData.createdAt,
            totalRequests: totalReqs,
            sosCount: sosCount
          });
        }
      }

      setCustomers(list);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const disableCustomer = async (customerId, reason, adminUserId) => {
    const ref = doc(db, 'users', customerId);
    await updateDoc(ref, {
      accountStatus: 'disabled',
      disabledAt: serverTimestamp(),
      disabledBy: adminUserId,
      disabledReason: reason
    });
    await logAdminActivity(adminUserId, 'DISABLE_CUSTOMER', { customerId, reason });
    await fetchCustomers();
  };

  const enableCustomer = async (customerId, adminUserId) => {
    const ref = doc(db, 'users', customerId);
    await updateDoc(ref, {
      accountStatus: 'active',
      disabledAt: null,
      disabledBy: null,
      disabledReason: null
    });
    await logAdminActivity(adminUserId, 'ENABLE_CUSTOMER', { customerId });
    await fetchCustomers();
  };

  const warnCustomer = async (customerId, reason, message, adminUserId) => {
    const ref = doc(db, 'users', customerId);
    const newWarning = {
      reason,
      message,
      timestamp: new Date().toISOString(),
      adminId: adminUserId
    };

    // Fetch existing user to check warnings length
    const snap = await getDoc(ref);
    const data = snap.data() || {};
    const existingWarnings = data.warnings || [];
    const updatedWarnings = [...existingWarnings, newWarning];

    const updates = {
      warnings: arrayUnion(newWarning)
    };

    // Auto-disable if strike limit (3 warnings) reached
    if (updatedWarnings.length >= 3) {
      updates.accountStatus = 'disabled';
      updates.disabledAt = serverTimestamp();
      updates.disabledBy = 'SYSTEM_AUTO_LIMIT';
      updates.disabledReason = 'Auto-disabled: Reached limit of 3 warning strikes.';
      await logAdminActivity(adminUserId, 'AUTO_DISABLE_CUSTOMER_STRIKES', { customerId });
    }

    await updateDoc(ref, updates);
    await logAdminActivity(adminUserId, 'WARN_CUSTOMER', { customerId, reason });
    await fetchCustomers();
  };

  const saveCustomerNotes = async (customerId, notes, adminUserId) => {
    const ref = doc(db, 'users', customerId);
    await updateDoc(ref, {
      adminNotes: notes
    });
    await logAdminActivity(adminUserId, 'SAVE_CUSTOMER_NOTES', { customerId });
    await fetchCustomers();
  };

  return {
    customers,
    loading,
    refreshCustomers: fetchCustomers,
    disableCustomer,
    enableCustomer,
    warnCustomer,
    saveCustomerNotes
  };
};
