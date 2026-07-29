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
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
  Alert,
  SafeAreaView,
  Image
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useUserStore from '../../store/useUserStore';
import useRequestStore from '../../store/useRequestStore';
import AddressPicker from '../../components/AddressPicker';
import RequestCard from '../../components/RequestCard';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../utils/theme';
import { getCurrentLocation, reverseGeocode, fetchNearbyMechanicShops } from '../../services/googleMaps';

const { width } = Dimensions.get('window');

const services = [
  { id: 'flat_tire', label: 'Tire Repair', icon: 'tire', color: '#FF6B35' },
  { id: 'battery', label: 'Battery Jump', icon: 'car-battery', color: '#2979FF' },
  { id: 'engine', label: 'Engine Help', icon: 'engine', color: '#FF1744' },
  { id: 'fuel', label: 'Fuel Delivery', icon: 'gas-station', color: '#FFB300' },
  { id: 'towing', label: 'Towing', icon: 'tow-truck', color: '#00C853' },
  { id: 'other', label: 'General Fix', icon: 'car-wrench', color: '#6B7280' },
];

const CustomerDashboard = ({ navigation }) => {
  const { profile, logout } = useUserStore();
  const { 
    onlineMechanics, 
    listenToOnlineMechanics, 
    fetchActiveRequest, 
    activeRequest,
    requestHistory,
    listenToHistory,
    cleanup 
  } = useRequestStore();
  const insets = useSafeAreaInsets();

  const [avatarError, setAvatarError] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('Detecting current location...');
  const [location, setLocation] = useState(null);
  const [isDetecting, setIsDetecting] = useState(true);
  const lastAddr = useRef(null);

  useEffect(() => {
    setAvatarError(false);
  }, [profile?.avatar]);

  useEffect(() => {
    // 1. Initial location fetch
    fetchLocation();
    
    // 2. Active Request Redirection
    if (activeRequest) {
      const ACTIVE_STATUSES = [
        'accepted',
        'en_route',
        'arrived',
        'in_progress',
        'repairing'
      ];
      const createdAtMs = activeRequest.createdAt?.toMillis?.() || (activeRequest.createdAt?.seconds ? activeRequest.createdAt.seconds * 1000 : 0) || Date.now();
      const TWO_HOURS = 2 * 60 * 60 * 1000;
      const isFresh = Date.now() - createdAtMs < TWO_HOURS;

      if (activeRequest.customerId === profile?.uid && ACTIVE_STATUSES.includes(activeRequest.status) && isFresh) {
        console.log('CustomerDashboard: Active request found, navigating to Tracking...');
        navigation.navigate('TrackMechanic', { requestId: activeRequest.id });
      } else if (!isFresh || ['completed', 'cancelled', 'expired'].includes(activeRequest.status)) {
        useRequestStore.setState({ activeRequest: null });
      }
    }
  }, [activeRequest?.id, profile?.uid]);

  useEffect(() => {
    // Listen to real-time online mechanics
    const unsubMechanics = listenToOnlineMechanics();
    let unsubHistory = null;
    
    // Check for active request and redirect if needed
    if (profile?.uid) {
      fetchActiveRequest(profile.uid, 'customer').then(req => {
        if (req) {
          const ACTIVE_STATUSES = [
            'accepted',
            'en_route',
            'arrived',
            'in_progress',
            'repairing'
          ];
          const createdAtMs = req.createdAt?.toMillis?.() || (req.createdAt?.seconds ? req.createdAt.seconds * 1000 : 0) || Date.now();
          const TWO_HOURS = 2 * 60 * 60 * 1000;
          const isFresh = Date.now() - createdAtMs < TWO_HOURS;

          if (req.customerId === profile.uid && ACTIVE_STATUSES.includes(req.status) && isFresh) {
            navigation.navigate('TrackMechanic', { requestId: req.id });
          } else if (!isFresh || ['completed', 'cancelled', 'expired'].includes(req.status)) {
            useRequestStore.setState({ activeRequest: null });
          }
        }
      });
      unsubHistory = listenToHistory(profile.uid, 'customer');
    }

    return () => {
      if (unsubMechanics) unsubMechanics();
      if (unsubHistory) unsubHistory();
      cleanup(false);
    };
  }, [profile?.uid]);

  const fetchLocation = async () => {
    setIsDetecting(true);
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
      const addr = await reverseGeocode(loc.latitude, loc.longitude);
      const finalAddr = addr || 'Location detected';
      setCurrentAddress(finalAddr);
      lastAddr.current = finalAddr;
    } catch (e) {
      setCurrentAddress(lastAddr.current || 'Location error');
      console.error(e);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleManualLocation = async (selected) => {
    setIsDetecting(true);
    setLocation({ latitude: selected.latitude, longitude: selected.longitude });
    setCurrentAddress(selected.address);
    setIsDetecting(false);
  };

  return (
    <View style={[styles.container, { paddingTop: 0 }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <LinearGradient colors={['#1a1a1a', '#000']} style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{profile?.name || 'User'}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              {profile?.avatar && !avatarError ? (
                <Image 
                  source={{ uri: profile.avatar }} 
                  style={styles.avatar} 
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {(profile?.name || 'User').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.locationContainer}>
            <AddressPicker onLocationSelected={handleManualLocation} currentAddress={currentAddress} />
            <View style={styles.statusBadge}>
              <Ionicons name={onlineMechanics.length > 0 ? "checkmark-circle" : "search"} size={14} color="#FFD700" />
              <Text style={styles.statusText}>
                {isDetecting ? 'Scanning area...' : `${onlineMechanics.length} mechanics online`}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Active Request Banner */}
        {activeRequest && activeRequest.status !== 'completed' && activeRequest.status !== 'cancelled' && (
          <Animatable.View animation="slideInDown" style={styles.activeBanner}>
            <TouchableOpacity 
              style={styles.activeBannerContent}
              onPress={() => navigation.navigate('TrackMechanic', { requestId: activeRequest.id })}
            >
              <View style={styles.activePulse}>
                <MaterialCommunityIcons name="map-marker-radius" size={24} color="#FFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.activeTitle}>Active Service Request</Text>
                <Text style={styles.activeSub}>Status: {activeRequest.status.replace('_', ' ').toUpperCase()}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </Animatable.View>
        )}

        {/* SOS Card */}
        <Animatable.View animation="pulse" iterationCount="infinite" duration={2000}>
          <TouchableOpacity 
            style={styles.sosCard} 
            onPress={() => navigation.navigate('SOS', { location })}
          >
            <LinearGradient colors={['#FF1744', '#B71C1C']} style={styles.sosGradient}>
              <View style={styles.sosIconContainer}>
                <MaterialCommunityIcons name="alert-octagon" size={32} color="#fff" />
              </View>
              <View style={styles.sosTextContainer}>
                <Text style={styles.sosTitle}>Emergency SOS</Text>
                <Text style={styles.sosSub}>Immediate help at your current location</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#fff" opacity={0.5} />
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>

        {/* Services Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required Services</Text>
          <View style={styles.grid}>
            {services.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.serviceItem}
                onPress={() => navigation.navigate('NearbyMechanics', { 
                  issueType: item.id, 
                  issueLabel: item.label, 
                  location, 
                  address: currentAddress 
                })}
              >
                <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                  <MaterialCommunityIcons name={item.icon} size={28} color={item.color} />
                </View>
                <Text style={styles.serviceLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Stats/Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Activity</Text>
            {activeRequest && (
              <TouchableOpacity onPress={() => navigation.navigate('TrackMechanic', { requestId: activeRequest.id })}>
                <Text style={styles.viewActiveText}>View Active Job →</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('RequestHistory')}>
              <Text style={styles.statValue}>{profile?.totalRequests || 0}</Text>
              <Text style={styles.statLabel}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Membership')}>
              <Text style={styles.statValue}>Gold</Text>
              <Text style={styles.statLabel}>Membership</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.statsRow, { marginTop: 12 }]}>
            <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('EmergencyContacts')}>
              <Text style={styles.statValue}>{profile?.emergencyContacts?.length || 0}</Text>
              <Text style={styles.statLabel}>Contacts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Support')}>
              <Text style={styles.statValue}>24/7</Text>
              <Text style={styles.statLabel}>Support</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity Log */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity Log</Text>
          {requestHistory && requestHistory.length > 0 ? (
            requestHistory.slice(0, 5).map((item) => (
              <RequestCard 
                key={item.id} 
                request={item} 
                role="customer" 
                onPress={() => {
                  if (item.status === 'completed' || item.status === 'cancelled') {
                    Alert.alert('Job Details', `Service: ${item.issueType?.replace('_', ' ').toUpperCase()}\nStatus: ${item.status.toUpperCase()}\nCost: ₹${item.actualCost || item.estimatedCost || 500}\nMechanic: ${item.mechanicName || 'General Dispatch'}`);
                  } else {
                    navigation.navigate('TrackMechanic', { requestId: item.id });
                  }
                }}
              />
            ))
          ) : (
            <View style={{ padding: 20, backgroundColor: '#f8f9fa', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc' }}>
              <MaterialCommunityIcons name="history" size={40} color="#bbb" />
              <Text style={{ color: '#888', fontSize: 13, marginTop: 8, textAlign: 'center' }}>No past roadside rescue transactions found.</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#FF5252" />
          <Text style={styles.logoutText}>Sign Out from RoadRescue</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  avatarPlaceholder: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  locationContainer: {
    width: '100%',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  statusText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  sosCard: {
    marginHorizontal: 24,
    marginTop: -25,
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  sosGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  sosIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  sosTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sosSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceItem: {
    width: (width - 48 - 20) / 3,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 20,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    padding: 16,
    marginHorizontal: 24,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },
  logoutText: {
    color: '#FF5252',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  activeBanner: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 16,
    ...SHADOWS.medium,
    zIndex: 100,
  },
  activeBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  activePulse: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTitle: {
    color: '#FFF',
    fontSize: 15,
    ...FONTS.bold,
  },
  activeSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    ...FONTS.medium,
  },
});

export default CustomerDashboard;
