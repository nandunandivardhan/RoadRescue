/**
 * Vehicle Store — Zustand
 * Manages user's saved vehicles
 */
import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../services/firebase';

const useVehicleStore = create((set, get) => ({
  vehicles: [],
  isLoading: false,
  error: null,

  /**
   * Fetch all vehicles for a user
   */
  fetchVehicles: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const q = query(
        collection(db, 'users', userId, 'vehicles')
      );
      const snapshot = await getDocs(q);
      const vehicleList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      set({ vehicles: vehicleList, isLoading: false });
      return vehicleList;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      return [];
    }
  },

  /**
   * Add a new vehicle
   */
  addVehicle: async (userId, vehicleData) => {
    set({ isLoading: true });
    try {
      const newVehicle = {
        ...vehicleData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, 'users', userId, 'vehicles'), newVehicle);
      const created = { id: docRef.id, ...newVehicle };
      
      set(state => ({ 
        vehicles: [...state.vehicles, created],
        isLoading: false 
      }));
      return { success: true, vehicle: created };
    } catch (error) {
      set({ isLoading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete a vehicle
   */
  deleteVehicle: async (userId, vehicleId) => {
    try {
      await deleteDoc(doc(db, 'users', userId, 'vehicles', vehicleId));
      set(state => ({
        vehicles: state.vehicles.filter(v => v.id !== vehicleId)
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}));

export default useVehicleStore;
