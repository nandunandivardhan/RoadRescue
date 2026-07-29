/**
 * MyVehiclesScreen — Manage user's saved vehicles
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useUserStore from '../../store/useUserStore';
import useVehicleStore from '../../store/useVehicleStore';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../utils/theme';

const MyVehiclesScreen = ({ navigation }) => {
  const { profile } = useUserStore();
  const { vehicles, fetchVehicles, addVehicle, deleteVehicle, isLoading } = useVehicleStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ make: '', model: '', year: '', color: '', plateNumber: '' });

  useEffect(() => {
    if (profile?.uid) fetchVehicles(profile.uid);
  }, [profile]);

  const handleAddVehicle = async () => {
    if (!newVehicle.make || !newVehicle.model || !newVehicle.plateNumber) {
      Alert.alert('Missing Info', 'Please provide make, model, and plate number.');
      return;
    }

    const result = await addVehicle(profile.uid, newVehicle);
    if (result.success) {
      setModalVisible(false);
      setNewVehicle({ make: '', model: '', year: '', color: '', plateNumber: '' });
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Vehicle', 'Are you sure you want to remove this vehicle?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteVehicle(profile.uid, id) },
    ]);
  };

  const renderVehicle = ({ item }) => (
    <View style={s.card}>
      <View style={s.cardIcon}>
        <MaterialCommunityIcons name="car-side" size={32} color={COLORS.primary} />
      </View>
      <View style={s.cardContent}>
        <Text style={s.vehicleName}>{item.year} {item.make} {item.model}</Text>
        <Text style={s.vehicleDetail}>{item.color} • {item.plateNumber}</Text>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item.id)} style={s.deleteBtn}>
        <MaterialCommunityIcons name="trash-can-outline" size={22} color={COLORS.danger} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>My Vehicles</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        renderItem={renderVehicle}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.empty}>
            <MaterialCommunityIcons name="car-off" size={64} color={COLORS.border} />
            <Text style={s.emptyText}>No vehicles added yet</Text>
            <Text style={s.emptySub}>Add your car to request help faster</Text>
          </View>
        }
      />

      <View style={s.footer}>
        <CustomButton title="Add New Vehicle" icon="plus" onPress={() => setModalVisible(true)} />
      </View>

      {/* Add Vehicle Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Add Vehicle</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <CustomInput label="Make (e.g. Honda)" value={newVehicle.make} onChangeText={(t) => setNewVehicle({...newVehicle, make: t})} icon="car-info" />
              <CustomInput label="Model (e.g. City)" value={newVehicle.model} onChangeText={(t) => setNewVehicle({...newVehicle, model: t})} icon="car-cog" />
              <CustomInput label="Year (e.g. 2022)" value={newVehicle.year} onChangeText={(t) => setNewVehicle({...newVehicle, year: t})} icon="calendar" keyboardType="numeric" />
              <CustomInput label="Color (e.g. White)" value={newVehicle.color} onChangeText={(t) => setNewVehicle({...newVehicle, color: t})} icon="palette" />
              <CustomInput label="Plate Number" value={newVehicle.plateNumber} onChangeText={(t) => setNewVehicle({...newVehicle, plateNumber: t})} icon="card-account-details" autoCapitalize="characters" />
              <View style={{ height: 20 }} />
              <CustomButton title="Save Vehicle" onPress={handleAddVehicle} loading={isLoading} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.md, paddingTop: 60, paddingBottom: 20, backgroundColor: COLORS.white },
  title: { fontSize: SIZES.h3, color: COLORS.textPrimary, ...FONTS.bold },
  list: { padding: SIZES.md },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 16, padding: SIZES.md, marginBottom: SIZES.md, ...SHADOWS.small },
  cardIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: COLORS.primaryGhost, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1, marginLeft: SIZES.md },
  vehicleName: { fontSize: SIZES.body, color: COLORS.textPrimary, ...FONTS.semiBold },
  vehicleDetail: { fontSize: SIZES.caption, color: COLORS.textTertiary, ...FONTS.regular, marginTop: 2 },
  deleteBtn: { padding: 8 },
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { fontSize: SIZES.h4, color: COLORS.textSecondary, ...FONTS.semiBold, marginTop: SIZES.md },
  emptySub: { fontSize: SIZES.bodySmall, color: COLORS.textTertiary, ...FONTS.regular, marginTop: SIZES.xs },
  footer: { padding: SIZES.md, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: SIZES.lg, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.xl },
  modalTitle: { fontSize: SIZES.h3, color: COLORS.textPrimary, ...FONTS.bold },
});

export default MyVehiclesScreen;
