import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import useUserStore from '../../store/useUserStore';
import useRequestStore from '../../store/useRequestStore';
import useVehicleStore from '../../store/useVehicleStore';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../utils/theme';
import { getServiceEstimate } from '../../services/paymentService';
import { getIssueIcon, formatCurrency } from '../../utils/helpers';

const RequestHelpScreen = ({ navigation, route }) => {
  const { issueType, issueLabel, location, address, isSOS } = route.params;
  const { profile } = useUserStore();
  const { createRequest, isLoading } = useRequestStore();
  const { vehicles, fetchVehicles } = useVehicleStore();
  const [description, setDescription] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const estimate = getServiceEstimate(issueType);

  useEffect(() => {
    if (profile?.uid) fetchVehicles(profile.uid);
  }, []);

  const selectVehicle = (v) => {
    setSelectedVehicleId(v.id);
    setVehicleInfo(`${v.make} ${v.model} (${v.plateNumber})`);
  };

  const handleSubmit = async () => {
    if (!address || address === 'Detecting location...' || !location) {
      Alert.alert('Location Required', 'Please wait until your location is detected before requesting help.');
      return;
    }

    if (!vehicleInfo) {
      Alert.alert('Vehicle Info Required', 'Please select or enter your vehicle information.');
      return;
    }

    const result = await createRequest({
      customerId: profile.uid,
      customerName: profile.name,
      customerPhone: profile.phoneNumber || '',
      issueType,
      description,
      vehicleInfo,
      location,
      locationAddress: address,
      estimatedCost: estimate.total,
    });
    
    if (result.success) {
      navigation.replace('TrackMechanic', { requestId: result.request.id });
    } else {
      Alert.alert('Submission Failed', result.error || 'Could not submit request');
    }
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>{isSOS ? '🚨 Emergency SOS' : 'Request Help'}</Text>

        {/* Issue Card */}
        <View style={s.issueCard}>
          <View style={[s.issueIcon, { backgroundColor: (isSOS ? COLORS.danger : COLORS.primary) + '15' }]}>
            <MaterialCommunityIcons name={getIssueIcon(issueType)} size={32} color={isSOS ? COLORS.danger : COLORS.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: SIZES.md }}>
            <Text style={s.issueLabel}>{issueLabel}</Text>
            <View style={s.locRow}><MaterialCommunityIcons name="map-marker" size={14} color={COLORS.textTertiary} /><Text style={s.locText} numberOfLines={1}>{address}</Text></View>
          </View>
        </View>

        {/* Details */}
        <View style={s.sectionHeader}>
          <Text style={s.section}>Select Vehicle</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MyVehicles')}>
            <Text style={s.manageLink}>Manage Garage</Text>
          </TouchableOpacity>
        </View>

        {vehicles.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.vehicleList}>
            {vehicles.map(v => (
              <TouchableOpacity 
                key={v.id} 
                style={[s.vehicleCard, selectedVehicleId === v.id && s.selectedVehicle]} 
                onPress={() => selectVehicle(v)}
              >
                <MaterialCommunityIcons 
                  name="car" 
                  size={24} 
                  color={selectedVehicleId === v.id ? COLORS.primary : COLORS.textSecondary} 
                />
                <Text style={[s.vehicleCardName, selectedVehicleId === v.id && s.selectedVehicleText]}>{v.model}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <TouchableOpacity style={s.addVehicleBanner} onPress={() => navigation.navigate('MyVehicles')}>
            <MaterialCommunityIcons name="plus-circle-outline" size={20} color={COLORS.primary} />
            <Text style={s.addVehicleText}>Add a vehicle to your profile for faster requests</Text>
          </TouchableOpacity>
        )}

        <CustomInput label="Vehicle Info" value={vehicleInfo} onChangeText={setVehicleInfo} icon="car" placeholder="e.g. Honda City 2022 White" autoCapitalize="words" />
        <CustomInput label="Describe the Issue" value={description} onChangeText={setDescription} icon="text-box-outline" placeholder="Any additional details..." multiline numberOfLines={3} />

        {/* Cost Estimate */}
        <View style={s.costCard}>
          <Text style={s.costTitle}>Estimated Cost</Text>
          <View style={s.costRow}><Text style={s.costLabel}>Base Service</Text><Text style={s.costValue}>{formatCurrency(estimate.basePrice)}</Text></View>
          {estimate.distanceSurcharge > 0 && <View style={s.costRow}><Text style={s.costLabel}>Distance Surcharge</Text><Text style={s.costValue}>{formatCurrency(estimate.distanceSurcharge)}</Text></View>}
          <View style={s.costDivider} />
          <View style={s.costRow}><Text style={s.costTotal}>Total</Text><Text style={s.costTotalValue}>{formatCurrency(estimate.total)}</Text></View>
        </View>

        <CustomButton title={isSOS ? '🚨 Send Emergency Request' : 'Request Mechanic'} onPress={handleSubmit} loading={isLoading} variant={isSOS ? 'danger' : 'primary'} icon="send" iconPosition="right" />
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SIZES.screenPadding, paddingTop: 50 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', marginBottom: SIZES.lg },
  title: { fontSize: SIZES.h2, color: COLORS.textPrimary, ...FONTS.bold, marginBottom: SIZES.xl },
  issueCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: SIZES.borderRadius, padding: SIZES.base, marginBottom: SIZES.xl, ...SHADOWS.medium },
  issueIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  issueLabel: { fontSize: SIZES.h4, color: COLORS.textPrimary, ...FONTS.semiBold },
  locRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  locText: { fontSize: SIZES.caption, color: COLORS.textTertiary, marginLeft: 4, flex: 1, ...FONTS.regular },
  section: { fontSize: SIZES.body, color: COLORS.textPrimary, ...FONTS.semiBold },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.md },
  manageLink: { fontSize: SIZES.caption, color: COLORS.primary, ...FONTS.medium },
  vehicleList: { marginBottom: SIZES.md, marginHorizontal: -SIZES.screenPadding, paddingLeft: SIZES.screenPadding },
  vehicleCard: { width: 100, padding: SIZES.sm, borderRadius: 12, backgroundColor: COLORS.surface, alignItems: 'center', marginRight: SIZES.md, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.small },
  selectedVehicle: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGhost },
  vehicleCardName: { fontSize: SIZES.caption, color: COLORS.textSecondary, ...FONTS.medium, marginTop: 4 },
  selectedVehicleText: { color: COLORS.primary },
  addVehicleBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryGhost, padding: SIZES.md, borderRadius: 12, marginBottom: SIZES.lg },
  addVehicleText: { fontSize: SIZES.caption, color: COLORS.primary, ...FONTS.medium, marginLeft: SIZES.sm },
  costCard: { backgroundColor: COLORS.surface, borderRadius: SIZES.borderRadius, padding: SIZES.base, marginBottom: SIZES.xl, ...SHADOWS.small },
  costTitle: { fontSize: SIZES.body, color: COLORS.textPrimary, ...FONTS.semiBold, marginBottom: SIZES.md },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SIZES.sm },
  costLabel: { fontSize: SIZES.bodySmall, color: COLORS.textSecondary, ...FONTS.regular },
  costValue: { fontSize: SIZES.bodySmall, color: COLORS.textPrimary, ...FONTS.medium },
  costDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: SIZES.sm },
  costTotal: { fontSize: SIZES.body, color: COLORS.textPrimary, ...FONTS.bold },
  costTotalValue: { fontSize: SIZES.h4, color: COLORS.primary, ...FONTS.bold },
});

export default RequestHelpScreen;
