import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef
} from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Alert, Linking, Dimensions, Modal, TextInput, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import MapViewComponent from '../../components/MapViewComponent';
import CustomButton from '../../components/CustomButton';
import Skeleton from '../../components/Skeleton';
import useRequestStore from '../../store/useRequestStore';
import useUserStore from '../../store/useUserStore';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../utils/theme';
import { getStatusColor, formatCurrency, getIssueIcon } from '../../utils/helpers';
import { getDirectionsUrl, fetchRoute } from '../../services/googleMaps';

const { height } = Dimensions.get('window');

const TrackMechanicScreen = ({ navigation, route }) => {
  const { requestId } = route.params;
  const { activeRequest, listenToRequest, submitRating, cancelRequest, cleanup } = useRequestStore();
  const [mapRegion, setMapRegion] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [mechanicLatestPhone, setMechanicLatestPhone] = useState('');
  const [mechanicVerified, setMechanicVerified] = useState(false);

  // Real-time listener for mechanic phone changes
  useEffect(() => {
    if (activeRequest?.mechanicId) {
      const unsub = onSnapshot(doc(db, 'users', activeRequest.mechanicId), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setMechanicLatestPhone(data.phone || data.phoneNumber || activeRequest.mechanicPhone || '');
        } else {
          setMechanicLatestPhone(activeRequest.mechanicPhone || '');
        }
      });
      return () => unsub();
    } else {
      setMechanicLatestPhone(activeRequest?.mechanicPhone || '');
    }
  }, [activeRequest?.mechanicId, activeRequest?.mechanicPhone]);

  // Real-time listener for mechanic verification changes
  useEffect(() => {
    if (activeRequest?.mechanicId) {
      const unsub = onSnapshot(doc(db, 'mechanics', activeRequest.mechanicId), (docSnap) => {
        if (docSnap.exists()) {
          setMechanicVerified(docSnap.data().verified === true);
        } else {
          setMechanicVerified(false);
        }
      });
      return () => unsub();
    } else {
      setMechanicVerified(false);
    }
  }, [activeRequest?.mechanicId]);

  // Animated coordinate for the mechanic
  const [animatedMechanicLoc] = useState(new Animated.ValueXY({
    x: activeRequest?.mechanicLocation?.latitude || 0,
    y: activeRequest?.mechanicLocation?.longitude || 0,
  }));

  useEffect(() => {
    const unsub = listenToRequest(requestId);
    
    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    return () => cleanup(false);
  }, [requestId]);

  // Animate mechanic movement and fetch route
  useEffect(() => {
    if (activeRequest?.mechanicLocation) {
      // 1. Animate marker movement
      Animated.timing(animatedMechanicLoc, {
        toValue: {
          x: activeRequest.mechanicLocation.latitude,
          y: activeRequest.mechanicLocation.longitude,
        },
        duration: 4000,
        useNativeDriver: false,
      }).start();

      // 2. Fetch route path
      if (activeRequest?.location) {
        fetchRoute(activeRequest.mechanicLocation, activeRequest.location)
          .then(points => setRoutePoints(points))
          .catch(err => console.log('Route fetch error:', err));
      }
    }
  }, [activeRequest?.mechanicLocation, activeRequest?.location]);

  const handleRatingSubmit = async () => {
    setIsSubmitting(true);
    const result = await submitRating(requestId, activeRequest.mechanicId, {
      score: rating,
      comment: comment,
    });
    
    setIsSubmitting(false);
    if (result.success) {
      setRatingModalVisible(false);
      Alert.alert('Success', 'Thank you for your feedback!', [
        { text: 'OK', onPress: () => navigation.navigate('CustomerHome') }
      ]);
    }
  };

  // Show rating modal when job is completed
  useEffect(() => {
    if (activeRequest?.status === 'completed' && !activeRequest?.rating) {
      setRatingModalVisible(true);
    }
  }, [activeRequest?.status]);

  useEffect(() => {
    if (activeRequest?.location) {
      setMapRegion({ latitude: activeRequest.location.latitude, longitude: activeRequest.location.longitude, latitudeDelta: 0.015, longitudeDelta: 0.015 });
    }
  }, [activeRequest]);

  const handleCancel = () => {
    Alert.alert('Cancel Request', 'Are you sure you want to cancel this request?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => { await cancelRequest(requestId); cleanup(true); navigation.navigate('CustomerHome'); } },
    ]);
  };

  const handleCall = () => {
    const targetPhone = mechanicLatestPhone || activeRequest?.mechanicPhone;
    if (targetPhone) {
      Linking.openURL(`tel:${targetPhone}`);
    } else {
      Alert.alert('Unavailable', 'Mechanic phone number is not available.');
    }
  };

  const handlePayment = () => {
    navigation.navigate('Payment', { requestId, amount: activeRequest?.finalCost || activeRequest?.estimatedCost });
  };

  const status = activeRequest?.status || 'pending';
  const statusColor = getStatusColor(status);
  const statusMessages = {
    pending: { title: 'Finding a Mechanic...', sub: 'Searching for available mechanics near you' },
    accepted: { title: 'Mechanic Assigned!', sub: `${activeRequest?.mechanicName || 'A mechanic'} is preparing to help you` },
    en_route: { title: 'On the Way!', sub: `${activeRequest?.mechanicName} is heading to your location` },
    arrived: { title: 'Mechanic Arrived!', sub: 'Your mechanic has reached your location' },
    in_progress: { title: 'Work in Progress', sub: 'Your vehicle is being serviced' },
    completed: { title: 'Service Complete! ✅', sub: 'Your service has been completed successfully' },
  };
  const msg = statusMessages[status] || { title: 'Processing...', sub: '' };

  // Use the animated coordinate for the map
  const mechanicLoc = {
    latitude: animatedMechanicLoc.x,
    longitude: animatedMechanicLoc.y,
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Map */}
      <View style={s.mapContainer}>
        <MapViewComponent 
          region={mapRegion} 
          mechanicLocation={mechanicLoc} 
          routePoints={routePoints}
          style={{ flex: 1, borderRadius: 0 }} 
        />
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <View style={s.sheet}>
        <View style={s.sheetHandle} />

        {/* Status */}
        <View style={s.statusRow}>
          <View style={[s.statusDot, { backgroundColor: statusColor }]} />
          <View style={{ flex: 1 }}>
            <Text style={s.statusTitle}>{msg.title}</Text>
            <Text style={s.statusSub}>{msg.sub}</Text>
          </View>
        </View>

        {/* Mechanic Info */}
        {activeRequest?.mechanicName && status !== 'pending' && (
          <View style={s.mechanicCard}>
            <View style={s.mechanicAvatar}><MaterialCommunityIcons name="account-wrench" size={24} color={COLORS.primary} /></View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={s.mechanicName}>{activeRequest.mechanicName}</Text>
                {mechanicVerified && (
                  <MaterialCommunityIcons name="certificate" size={16} color={COLORS.primary} style={{ marginLeft: 4 }} />
                )}
              </View>
              <Text style={s.mechanicRole}>Mechanic</Text>
            </View>
            <View style={s.mechanicActions}>
              <TouchableOpacity style={s.chatBtn} onPress={() => navigation.navigate('Chat', { requestId, recipientName: activeRequest.mechanicName })}>
                <MaterialCommunityIcons name="chat" size={20} color={COLORS.primary} />
                {activeRequest?.lastMessageSender && activeRequest.lastMessageSender === activeRequest.mechanicId && (
                  <View style={s.unreadBadge} />
                )}
              </TouchableOpacity>
              <TouchableOpacity style={[s.callBtn, { marginLeft: SIZES.sm }]} onPress={handleCall}>
                <MaterialCommunityIcons name="phone" size={20} color={COLORS.success} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Actions */}
        {status === 'pending' && <CustomButton title="Cancel Request" onPress={handleCancel} variant="outline" icon="close" />}
        {status === 'completed' && <CustomButton title="Make Payment" onPress={handlePayment} icon="credit-card-outline" />}
      </View>

      {/* Rating Modal */}
      <Modal visible={ratingModalVisible} animationType="fade" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <View style={s.successIcon}>
                <MaterialCommunityIcons name="check-decagram" size={48} color={COLORS.success} />
              </View>
              <Text style={s.modalTitle}>Job Completed!</Text>
              <Text style={s.modalSub}>How was your experience with {activeRequest?.mechanicName}?</Text>
            </View>

            <View style={s.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <MaterialCommunityIcons 
                    name={star <= rating ? "star" : "star-outline"} 
                    size={40} 
                    color={star <= rating ? "#FFD700" : COLORS.border} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={s.ratingInput}
              placeholder="Leave a comment (optional)..."
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={3}
            />

            <View style={s.modalActions}>
              <CustomButton 
                title="Submit Review" 
                onPress={handleRatingSubmit} 
                loading={isSubmitting}
                icon="send"
              />
              <TouchableOpacity 
                style={s.skipBtn} 
                onPress={() => navigation.navigate('CustomerHome')}
              >
                <Text style={s.skipText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  mapContainer: { flex: 1 },
  backBtn: { position: 'absolute', top: 60, left: SIZES.screenPadding, width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', ...SHADOWS.medium, zIndex: 10 },
  sheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: SIZES.screenPadding, paddingTop: SIZES.md, paddingBottom: 30, ...SHADOWS.large, marginTop: -20 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: SIZES.lg },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.lg },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: SIZES.md },
  statusTitle: { fontSize: SIZES.h4, color: COLORS.textPrimary, ...FONTS.bold },
  statusSub: { fontSize: SIZES.bodySmall, color: COLORS.textSecondary, ...FONTS.regular, marginTop: 2 },
  mechanicCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: SIZES.borderRadius, padding: SIZES.md, marginBottom: SIZES.lg },
  mechanicAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primaryGhost, alignItems: 'center', justifyContent: 'center' },
  mechanicName: { fontSize: SIZES.body, color: COLORS.textPrimary, ...FONTS.semiBold, marginLeft: SIZES.md },
  mechanicRole: { fontSize: SIZES.caption, color: COLORS.textTertiary, ...FONTS.regular, marginLeft: SIZES.md },
  mechanicActions: { flexDirection: 'row', alignItems: 'center' },
  chatBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryGhost, alignItems: 'center', justifyContent: 'center' },
  unreadBadge: { position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.danger, borderWidth: 2, borderColor: COLORS.surface },
  callBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.successLight, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: SIZES.lg },
  modalContent: { backgroundColor: COLORS.white, borderRadius: 24, padding: SIZES.xl, alignItems: 'center', ...SHADOWS.large },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.success + '15', alignItems: 'center', justifyContent: 'center', marginBottom: SIZES.md },
  modalTitle: { fontSize: SIZES.h3, color: COLORS.textPrimary, ...FONTS.bold, marginBottom: SIZES.xs },
  modalSub: { fontSize: SIZES.bodySmall, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SIZES.xl, ...FONTS.regular },
  starsContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: SIZES.md, marginBottom: SIZES.xl },
  ratingInput: { width: '100%', backgroundColor: COLORS.background, borderRadius: 12, padding: SIZES.md, fontSize: SIZES.bodySmall, color: COLORS.textPrimary, minHeight: 80, marginBottom: SIZES.xl, textAlignVertical: 'top' },
  modalActions: { width: '100%' },
  skipBtn: { marginTop: SIZES.md, padding: SIZES.xs, alignItems: 'center' },
  skipText: { fontSize: SIZES.caption, color: COLORS.textTertiary, ...FONTS.medium },
});

export default TrackMechanicScreen;
