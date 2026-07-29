import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Alert, Linking, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapViewComponent from '../../components/MapViewComponent';
import CustomButton from '../../components/CustomButton';
import useUserStore from '../../store/useUserStore';
import useRequestStore from '../../store/useRequestStore';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../utils/theme';
import { getIssueIcon, getStatusColor, formatCurrency } from '../../utils/helpers';
import { getCurrentLocation, getDirectionsUrl } from '../../services/googleMaps';

const JobDetailScreen = ({ navigation, route }) => {
  const { requestId, request: initialRequest } = route.params;
  const { profile } = useUserStore();
  const { activeRequest, acceptRequest, updateRequestStatus, updateMechanicLocation, listenToRequest, cleanup } = useRequestStore();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const req = activeRequest || initialRequest;

  useEffect(() => {
    if (requestId) { const unsub = listenToRequest(requestId); return () => cleanup(); }
  }, [requestId]);

  const handleAccept = async () => {
    setIsAccepting(true);
    const result = await acceptRequest(requestId, profile);
    setIsAccepting(false);
    if (!result.success) Alert.alert('Error', result.error);
  };

  const handleStatusUpdate = async (newStatus) => {
    setIsUpdating(true);
    const loc = await getCurrentLocation();
    await updateMechanicLocation(requestId, loc);
    await updateRequestStatus(requestId, newStatus);
    setIsUpdating(false);
  };

  const handleNavigate = async () => {
    if (req?.location) {
      const url = getDirectionsUrl(req.location.latitude, req.location.longitude);
      Linking.openURL(url);
    }
  };

  const handleCall = () => { if (req?.customerPhone) Linking.openURL(`tel:${req.customerPhone}`); };

  const status = req?.status || 'pending';
  const statusColor = getStatusColor(status);
  const custLoc = req?.location ? { latitude: req.location.latitude, longitude: req.location.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 } : null;

  const nextStatusMap = { accepted: 'en_route', en_route: 'arrived', arrived: 'in_progress', in_progress: 'completed' };
  const nextLabels = { accepted: 'Start Driving', en_route: 'I Have Arrived', arrived: 'Start Work', in_progress: 'Complete Job' };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={s.scroll}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>Job Details</Text>

        {/* Map */}
        {custLoc && <View style={s.mapCard}><MapViewComponent region={custLoc} markers={[{ ...custLoc, title: 'Customer', color: COLORS.danger }]} style={{ height: 200 }} /></View>}

        {/* Issue Info */}
        <View style={s.infoCard}>
          <View style={s.infoRow}>
            <View style={[s.issueBadge, { backgroundColor: statusColor + '15' }]}>
              <MaterialCommunityIcons name={getIssueIcon(req?.issueType)} size={28} color={statusColor} />
            </View>
            <View style={{ flex: 1, marginLeft: SIZES.md }}>
              <Text style={s.issueLabel}>{(req?.issueType || '').replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</Text>
              <View style={[s.statusBadge, { backgroundColor: statusColor + '15' }]}><Text style={[s.statusText, { color: statusColor }]}>{status.toUpperCase()}</Text></View>
            </View>
            <Text style={s.costText}>{formatCurrency(req?.estimatedCost || 0)}</Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={s.infoCard}>
          <Text style={s.cardTitle}>Customer</Text>
          <View style={s.detailRow}><MaterialCommunityIcons name="account" size={18} color={COLORS.textTertiary} /><Text style={s.detailText}>{req?.customerName || 'Unknown'}</Text></View>
          <View style={s.detailRow}><MaterialCommunityIcons name="map-marker" size={18} color={COLORS.textTertiary} /><Text style={s.detailText}>{req?.locationAddress || 'Unknown'}</Text></View>
          {req?.description && <View style={s.detailRow}><MaterialCommunityIcons name="text" size={18} color={COLORS.textTertiary} /><Text style={s.detailText}>{req.description}</Text></View>}
          {req?.vehicleInfo && <View style={s.detailRow}><MaterialCommunityIcons name="car" size={18} color={COLORS.textTertiary} /><Text style={s.detailText}>{req.vehicleInfo}</Text></View>}
        </View>

        {/* Actions */}
        {status !== 'pending' && (
          <View style={{ marginBottom: SIZES.md }}>
            <CustomButton 
              title="Chat with Customer" 
              onPress={() => navigation.navigate('Chat', { requestId, recipientName: req?.customerName })} 
              variant="secondary" 
              icon="chat" 
            />
          </View>
        )}
        {status === 'pending' && <CustomButton title="Accept Job" onPress={handleAccept} loading={isAccepting} icon="check" variant="secondary" />}
        {nextStatusMap[status] && (
          <View>
            <CustomButton title={nextLabels[status]} onPress={() => handleStatusUpdate(nextStatusMap[status])} loading={isUpdating} icon="chevron-right" iconPosition="right" />
            <View style={{ height: SIZES.md }} />
            <CustomButton title="Navigate to Customer" onPress={handleNavigate} variant="outline" icon="navigation" />
          </View>
        )}
        {status !== 'pending' && req?.customerPhone && (
          <View style={{ marginTop: SIZES.md }}><CustomButton title="Call Customer" onPress={handleCall} variant="ghost" icon="phone" /></View>
        )}
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
  mapCard: { borderRadius: SIZES.borderRadius, overflow: 'hidden', marginBottom: SIZES.lg, ...SHADOWS.medium },
  infoCard: { backgroundColor: COLORS.surface, borderRadius: SIZES.borderRadius, padding: SIZES.base, marginBottom: SIZES.lg, ...SHADOWS.small },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  issueBadge: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  issueLabel: { fontSize: SIZES.h4, color: COLORS.textPrimary, ...FONTS.semiBold },
  statusBadge: { paddingHorizontal: SIZES.sm, paddingVertical: 2, borderRadius: SIZES.borderRadiusFull, alignSelf: 'flex-start', marginTop: 4 },
  statusText: { fontSize: SIZES.tiny, ...FONTS.bold, letterSpacing: 0.5 },
  costText: { fontSize: SIZES.h4, color: COLORS.primary, ...FONTS.bold },
  cardTitle: { fontSize: SIZES.body, color: COLORS.textPrimary, ...FONTS.semiBold, marginBottom: SIZES.md },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SIZES.sm },
  detailText: { fontSize: SIZES.bodySmall, color: COLORS.textSecondary, marginLeft: SIZES.sm, flex: 1, ...FONTS.regular },
});

export default JobDetailScreen;
