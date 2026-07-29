import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import * as Animatable from 'react-native-animatable';
import MapViewComponent from '../../components/MapViewComponent';
import CustomButton from '../../components/CustomButton';
import useRequestStore from '../../store/useRequestStore';
import { COLORS, SHADOWS, SIZES, FONTS } from '../../utils/theme';
import { watchLocation, fetchRoute, getDirectionsUrl } from '../../services/googleMaps';

const { height } = Dimensions.get('window');

const ActiveJobScreen = ({ navigation, route }) => {
  const { requestId } = route.params;
  const { activeRequest, listenToRequest, updateRequestStatus, updateMechanicLocation, cleanup } = useRequestStore();
  const [routePoints, setRoutePoints] = useState([]);
  const [currentLoc, setCurrentLoc] = useState(null);
  const locationWatcher = useRef(null);
  const [customerLatestPhone, setCustomerLatestPhone] = useState('');

  // Real-time listener for customer phone changes
  useEffect(() => {
    if (activeRequest?.customerId) {
      const unsub = onSnapshot(doc(db, 'users', activeRequest.customerId), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCustomerLatestPhone(data.phone || data.phoneNumber || activeRequest.customerPhone || '');
        } else {
          setCustomerLatestPhone(activeRequest.customerPhone || '');
        }
      });
      return () => unsub();
    } else {
      setCustomerLatestPhone(activeRequest?.customerPhone || '');
    }
  }, [activeRequest?.customerId, activeRequest?.customerPhone]);

  useEffect(() => {
    // 1. Listen to the request updates (status changes etc)
    const unsubRequest = listenToRequest(requestId);

    // 2. Start watching mechanic's location
    const startWatching = async () => {
      try {
        locationWatcher.current = await watchLocation((loc) => {
          setCurrentLoc(loc);
          // Sync location to Firestore for the customer to see
          updateMechanicLocation(requestId, loc);
        });
      } catch (e) {
        console.log('Location watch error:', e);
      }
    };
    
    startWatching();

    return () => {
      cleanup(false);
      if (locationWatcher.current) locationWatcher.current.remove();
    };
  }, [requestId]);

  // Fetch route when current location or customer location changes
  useEffect(() => {
    if (currentLoc && activeRequest?.location) {
      fetchRoute(currentLoc, activeRequest.location)
        .then(points => setRoutePoints(points))
        .catch(err => console.log('Route error:', err));
    }
  }, [currentLoc, activeRequest?.location]);

  const handleUpdateStatus = async (newStatus) => {
    const result = await updateRequestStatus(requestId, newStatus);
    if (result.success) {
      if (newStatus === 'completed') {
        Alert.alert('Job Completed!', 'Excellent work. Returning to dashboard.', [
          { text: 'OK', onPress: () => navigation.navigate('MechanicHome') }
        ]);
      }
    } else {
      Alert.alert('Update Failed', result.error);
    }
  };

  const handleCall = () => {
    const targetPhone = customerLatestPhone || activeRequest?.customerPhone;
    if (targetPhone) {
      Linking.openURL(`tel:${targetPhone}`);
    } else {
      Alert.alert('Unavailable', 'Customer phone number is not available.');
    }
  };

  const handleNavigation = () => {
    if (activeRequest?.location) {
      const url = getDirectionsUrl(activeRequest.location.latitude, activeRequest.location.longitude);
      Linking.openURL(url);
    }
  };

  if (!activeRequest) return null;

  const status = activeRequest.status;
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <View style={styles.mapContainer}>
        <MapViewComponent 
          region={currentLoc ? { ...currentLoc, latitudeDelta: 0.015, longitudeDelta: 0.015 } : null}
          mechanicLocation={currentLoc}
          customerLocation={activeRequest.location}
          routePoints={routePoints}
          style={{ flex: 1 }}
        />
        
        <SafeAreaView style={styles.topOverlay} edges={['top']}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('MechanicHome')}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.statusBadge}>
            <Text style={styles.statusLabel}>Job: {status?.replace('_', ' ').toUpperCase()}</Text>
          </View>
        </SafeAreaView>
      </View>

      <Animatable.View animation="fadeInUp" style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        
        <View style={styles.customerRow}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.customerName}>{activeRequest.customerName}</Text>
            <Text style={styles.issueType}>{activeRequest.issueType?.replace('_', ' ')}</Text>
          </View>
          <TouchableOpacity style={[styles.callBtn, { backgroundColor: COLORS.primary, marginRight: 10 }]} onPress={() => navigation.navigate('Chat', { requestId, recipientName: activeRequest.customerName })}>
            <Ionicons name="chatbubble" size={20} color="#fff" />
            {activeRequest?.lastMessageSender && activeRequest.lastMessageSender === activeRequest.customerId && (
              <View style={styles.unreadBadge} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
            <Ionicons name="call" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.addressBox}>
          <Ionicons name="location-outline" size={18} color={COLORS.primary} />
          <Text style={styles.addressText} numberOfLines={2}>{activeRequest.locationAddress}</Text>
        </View>

        <View style={styles.actions}>
          {status === 'accepted' && (
            <CustomButton 
              title="Start Journey (En Route)" 
              onPress={() => handleUpdateStatus('en_route')}
              icon="truck-delivery"
            />
          )}
          {status === 'en_route' && (
            <View style={styles.btnGroup}>
              <TouchableOpacity style={styles.navBtn} onPress={handleNavigation}>
                <Ionicons name="navigate" size={20} color={COLORS.primary} />
                <Text style={styles.navText}>Navigate</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <CustomButton 
                  title="I Have Arrived" 
                  onPress={() => handleUpdateStatus('arrived')}
                />
              </View>
            </View>
          )}
          {status === 'arrived' && (
            <CustomButton 
              title="Start Working" 
              onPress={() => handleUpdateStatus('in_progress')}
              icon="wrench"
            />
          )}
          {status === 'in_progress' && (
            <CustomButton 
              title="Mark as Completed" 
              onPress={() => handleUpdateStatus('completed')}
              icon="check-circle"
              variant="success"
            />
          )}
        </View>
      </Animatable.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  mapContainer: { flex: 1 },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  statusBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    ...SHADOWS.small,
  },
  statusLabel: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingTop: 12,
    ...SHADOWS.large,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1, marginLeft: 15 },
  customerName: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  issueType: { fontSize: 12, color: '#666', textTransform: 'capitalize' },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF5252',
    borderWidth: 2,
    borderColor: '#fff',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  addressText: { flex: 1, marginLeft: 10, fontSize: 13, color: '#444' },
  actions: { gap: 12 },
  btnGroup: { flexDirection: 'row', gap: 12 },
  navBtn: {
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navText: { color: COLORS.primary, fontSize: 12, fontWeight: 'bold', marginTop: 2 },
});

export default ActiveJobScreen;
