import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { logAdminActivity } from '../services/adminAuthService';

export const useAdminMechanics = () => {
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMechanics = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'mechanics'));
      const list = [];
      
      for (const docSnap of snap.docs) {
        const mech = docSnap.data();
        let fullName = 'Certified Rescue Partner';
        let phone = '';
        let email = '';
        
        try {
          const userDoc = await getDoc(doc(db, 'users', docSnap.id));
          if (userDoc.exists()) {
            fullName = userDoc.data().name || fullName;
            phone = userDoc.data().phone || phone;
            email = userDoc.data().email || email;
          }
        } catch (e) {
          console.error(`Failed to load user info for mechanic ${docSnap.id}:`, e);
        }

        list.push({
          id: docSnap.id,
          fullName,
          phone,
          email,
          ...mech
        });
      }

      setMechanics(list);
    } catch (err) {
      console.error('Failed to fetch mechanics list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMechanics();
  }, []);

  const approveMechanic = async (mechanicId, adminUserId) => {
    const ref = doc(db, 'mechanics', mechanicId);
    await updateDoc(ref, {
      status: 'approved',
      approvedAt: serverTimestamp(),
      approvedBy: adminUserId
    });
    await logAdminActivity(adminUserId, 'APPROVE_MECHANIC', { mechanicId });
    await fetchMechanics();
  };

  const rejectMechanic = async (mechanicId, reason, adminUserId) => {
    const ref = doc(db, 'mechanics', mechanicId);
    await updateDoc(ref, {
      status: 'rejected',
      rejectionReason: reason,
      rejectionAt: serverTimestamp(),
      rejectionBy: adminUserId
    });
    await logAdminActivity(adminUserId, 'REJECT_MECHANIC', { mechanicId, reason });
    await fetchMechanics();
  };

  const suspendMechanic = async (mechanicId, reason, durationDays, adminUserId) => {
    const ref = doc(db, 'mechanics', mechanicId);
    const suspendedUntil = new Date();
    suspendedUntil.setDate(suspendedUntil.getDate() + parseInt(durationDays, 10));

    await updateDoc(ref, {
      status: 'suspended',
      suspendedUntil: suspendedUntil.toISOString(),
      suspensionReason: reason,
      suspendedBy: adminUserId,
      isOnline: false,
      isAvailable: false
    });
    await logAdminActivity(adminUserId, 'SUSPEND_MECHANIC', { mechanicId, reason, durationDays });
    await fetchMechanics();
  };

  const unsuspendMechanic = async (mechanicId, adminUserId) => {
    const ref = doc(db, 'mechanics', mechanicId);
    await updateDoc(ref, {
      status: 'approved',
      suspendedUntil: null,
      suspensionReason: null,
      suspendedBy: null
    });
    await logAdminActivity(adminUserId, 'UNSUSPEND_MECHANIC', { mechanicId });
    await fetchMechanics();
  };

  const verifyMechanic = async (mechanicId, adminUserId) => {
    const ref = doc(db, 'mechanics', mechanicId);
    await updateDoc(ref, {
      verified: true,
      verifiedAt: serverTimestamp(),
      verifiedBy: adminUserId
    });
    await logAdminActivity(adminUserId, 'VERIFY_MECHANIC', { mechanicId });
    await fetchMechanics();
  };

  const unverifyMechanic = async (mechanicId, adminUserId) => {
    const ref = doc(db, 'mechanics', mechanicId);
    await updateDoc(ref, {
      verified: false,
      verifiedAt: null,
      verifiedBy: null
    });
    await logAdminActivity(adminUserId, 'UNVERIFY_MECHANIC', { mechanicId });
    await fetchMechanics();
  };

  const updateMechanicData = async (mechanicId, fields, adminUserId) => {
    const mechRef = doc(db, 'mechanics', mechanicId);
    await updateDoc(mechRef, fields);

    // If name is edited, update the corresponding users profile too
    if (fields.fullName || fields.name) {
      const userRef = doc(db, 'users', mechanicId);
      await updateDoc(userRef, {
        name: fields.fullName || fields.name
      });
    }

    await logAdminActivity(adminUserId, 'EDIT_MECHANIC_DATA', { mechanicId, fields });
    await fetchMechanics();
  };

  const saveAdminNotes = async (mechanicId, notes, adminUserId) => {
    const ref = doc(db, 'mechanics', mechanicId);
    await updateDoc(ref, {
      adminNotes: notes
    });
    await logAdminActivity(adminUserId, 'SAVE_MECHANIC_NOTES', { mechanicId });
    await fetchMechanics();
  };

  return {
    mechanics,
    loading,
    refreshMechanics: fetchMechanics,
    approveMechanic,
    rejectMechanic,
    suspendMechanic,
    unsuspendMechanic,
    verifyMechanic,
    unverifyMechanic,
    updateMechanicData,
    saveAdminNotes
  };
};
