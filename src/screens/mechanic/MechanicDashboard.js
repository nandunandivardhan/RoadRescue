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
  StatusBar,
  Switch,
  Dimensions,
  Image,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import useUserStore from '../../store/useUserStore';
import useRequestStore from '../../store/useRequestStore';
import { getCurrentLocation } from '../../services/googleMaps';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import PendingRequestCard from '../../components/PendingRequestCard';
import RequestCard from '../../components/RequestCard';
import { COLORS, SHADOWS, SIZES, FONTS } from '../../utils/theme';

const { width } = Dimensions.get('window');

const MechanicDashboard = ({ navigation }) => {
  const { profile, logout, updateProfile } = useUserStore();
  const { 
    nearbyRequests, 
    listenToNearbyRequests, 
    acceptRequest, 
    fetchActiveRequest, 
    activeRequest, 
    requestHistory,
    listenToHistory,
    cleanup, 
    isLoading 
  } = useRequestStore();
  const [isOnline, setIsOnline] = useState(profile?.isOnline || false);
  const [location, setLocation] = useState(null);
  const insets = useSafeAreaInsets();
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [profile?.avatar]);

  useEffect(() => {
    // 1. Initial location fetch
    fetchLocation();
    
    // 2. Active Request Redirection & Restoration
    if (profile?.uid) {
      fetchActiveRequest(profile.uid, 'mechanic').then(req => {
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

          if (req.mechanicId === profile.uid && ACTIVE_STATUSES.includes(req.status) && isFresh) {
            navigation.navigate('ActiveJob', { requestId: req.id });
          } else if (!isFresh || ['completed', 'cancelled', 'expired'].includes(req.status)) {
            useRequestStore.setState({ activeRequest: null });
          }
        }
      });
    }

    let unsubHistory = null;
    if (profile?.uid) {
      unsubHistory = listenToHistory(profile.uid, 'mechanic');
    }

    // Realtime status listener to force logout if suspended or unapproved by admin
    let unsubStatus = null;
    if (profile?.uid) {
      unsubStatus = onSnapshot(doc(db, 'mechanics', profile.uid), (docSnap) => {
        if (docSnap.exists()) {
          const mData = docSnap.data();
          const status = mData.status || 'pending_approval';
          
          const isApproved = mData.approved === true || mData.isApproved === true || status === 'active' || status === 'approved';
          const isSuspended = mData.suspended === true || status === 'suspended';
          const isRejected = mData.approved === false || status === 'rejected';

          if (isSuspended) {
            Alert.alert('Access Denied', 'Your mechanic account has been suspended by a RoadRescue administrator.');
            logout();
          } else if (isRejected) {
            Alert.alert('Access Denied', 'Your mechanic registration credentials were rejected.');
            logout();
          } else if (!isApproved) {
            Alert.alert('Access Denied', 'Your mechanic registration credentials are pending review.');
            logout();
          }
        }
      });
    }

    return () => {
      cleanup();
      if (unsubHistory) unsubHistory();
      if (unsubStatus) unsubStatus();
    };
  }, [profile?.uid]);

  useEffect(() => {
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

      if (activeRequest.mechanicId === profile?.uid && ACTIVE_STATUSES.includes(activeRequest.status) && isFresh) {
        console.log('MechanicDashboard: Active job found, navigating...');
        navigation.navigate('ActiveJob', { requestId: activeRequest.id });
      } else if (!isFresh || ['completed', 'cancelled', 'expired'].includes(activeRequest.status)) {
        useRequestStore.setState({ activeRequest: null });
      }
    }
  }, [activeRequest?.id, profile?.uid]);

  const fetchLocation = async () => {
    const loc = await getCurrentLocation();
    setLocation(loc);
    if (isOnline) {
      listenToNearbyRequests(loc);
    }
  };

  const toggleOnline = async (value) => {
    setIsOnline(value);
    await updateProfile({ isOnline: value });
    if (value) {
      if (location) {
        listenToNearbyRequests(location);
      } else {
        fetchLocation();
      }
    } else {
      cleanup();
    }
  };

  const handleAccept = async (request) => {
    Alert.alert(
      'Accept Job',
      `Are you sure you want to accept this ${request.issueType?.replace('_', ' ')} job?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Accept', 
          onPress: async () => {
            const result = await acceptRequest(request.id, profile, location);
            if (result.success) {
              navigation.navigate('ActiveJob', { requestId: request.id });
            } else {
              Alert.alert('Error', result.error);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        stickyHeaderIndices={[0]}
      >
        
        {/* Header */}
        <LinearGradient colors={['#FF6B35', '#E65100']} style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View>
            <View style={styles.topRow}>
              <View>
                <Text style={styles.greeting}>Mechanic Portal</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.userName}>{profile?.name || 'Pro Mechanic'}</Text>
                  {profile?.verified && (
                    <MaterialCommunityIcons name="certificate" size={18} color="#fff" style={{ marginLeft: 6 }} />
                  )}
                </View>
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

            <View style={styles.statusBox}>
              <View style={styles.statusInfo}>
                <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4CAF50' : '#FF5252' }]} />
                <Text style={styles.statusTitle}>{isOnline ? 'Scanning for Jobs...' : 'Currently Offline'}</Text>
              </View>
              <Switch
                value={isOnline}
                onValueChange={toggleOnline}
                trackColor={{ false: '#333', true: '#fff' }}
                thumbColor={isOnline ? '#4CAF50' : '#f4f3f4'}
              />
            </View>
          </View>
        </LinearGradient>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile?.rating || '5.0'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
            <View style={styles.statIcon}><Ionicons name="star" size={16} color="#FFD700" /></View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile?.totalJobs || 0}</Text>
            <Text style={styles.statLabel}>Jobs</Text>
            <View style={styles.statIcon}><Ionicons name="briefcase" size={16} color="#FF6B35" /></View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{profile?.earnings || 0}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
            <View style={styles.statIcon}><Ionicons name="wallet" size={16} color="#FFD700" /></View>
          </View>
        </View>

        {/* Active Requests Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Requests ({nearbyRequests.length})</Text>
            <TouchableOpacity onPress={fetchLocation}><Ionicons name="refresh" size={20} color="#666" /></TouchableOpacity>
          </View>

          {isOnline ? (
            nearbyRequests.length > 0 ? (
              nearbyRequests.map(req => (
                <PendingRequestCard 
                  key={req.id} 
                  request={req} 
                  mechanicLocation={location}
                  onAccept={handleAccept}
                  onReject={() => {}}
                />
              ))
            ) : (
              <Animatable.View animation="fadeIn" style={styles.emptyRequests}>
                <MaterialCommunityIcons name="radar" size={60} color="#FFE0B2" />
                <Text style={styles.emptyTitle}>Scanning Area...</Text>
                <Text style={styles.emptySub}>No pending requests within 25km. We'll alert you when someone needs help!</Text>
                {isLoading && <ActivityIndicator color="#FF6B35" style={{ marginTop: 20 }} />}
              </Animatable.View>
            )
          ) : (
            <View style={styles.offlinePlaceholder}>
              <MaterialCommunityIcons name="sleep" size={60} color="#eee" />
              <Text style={styles.emptyTitle}>You're Offline</Text>
              <Text style={styles.emptySub}>Go online to start receiving service requests from nearby drivers.</Text>
            </View>
          )}
        </View>

        {/* Recent Activity Log */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity Log</Text>
          {requestHistory && requestHistory.length > 0 ? (
            requestHistory.slice(0, 5).map((item) => (
              <RequestCard 
                key={item.id} 
                request={item} 
                role="mechanic" 
                onPress={() => {
                  Alert.alert('Job Details', `Service: ${item.issueType?.replace('_', ' ').toUpperCase()}\nStatus: ${item.status.toUpperCase()}\nEarnings: ₹${item.actualCost || item.estimatedCost || 500}\nCustomer: ${item.customerName || 'Stranded Driver'}`);
                }}
              />
            ))
          ) : (
            <View style={{ padding: 20, backgroundColor: '#f8f9fa', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc' }}>
              <MaterialCommunityIcons name="history" size={40} color="#bbb" />
              <Text style={{ color: '#888', fontSize: 13, marginTop: 8, textAlign: 'center' }}>No completed or past jobs found.</Text>
            </View>
          )}
        </View>

        {/* Quick Tools */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mechanic Tools</Text>
          <View style={styles.toolsGrid}>
            <TouchableOpacity style={styles.toolItem} onPress={() => navigation.navigate('ServiceArea')}>
              <View style={[styles.toolIcon, { backgroundColor: '#E3F2FD' }]}><Ionicons name="map" size={24} color="#1E88E5" /></View>
              <Text style={styles.toolLabel}>Service Area</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolItem} onPress={() => navigation.navigate('Inventory')}>
              <View style={[styles.toolIcon, { backgroundColor: '#F3E5F5' }]}><Ionicons name="build" size={24} color="#8E24AA" /></View>
              <Text style={styles.toolLabel}>Inventory</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolItem} onPress={() => navigation.navigate('Alerts')}>
              <View style={[styles.toolIcon, { backgroundColor: '#FFF3E0' }]}><Ionicons name="notifications" size={24} color="#FB8C00" /></View>
              <Text style={styles.toolLabel}>Alerts</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#FF5252" />
          <Text style={styles.logoutText}>Log Out from Portal</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1 },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 60,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  greeting: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  userName: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#fff' },
  avatarPlaceholder: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  statusBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusInfo: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  statusTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: -30,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  statIcon: { marginTop: 8 },
  section: { marginTop: 32, paddingHorizontal: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  emptyRequests: {
    padding: 40,
    backgroundColor: '#FFF8F1',
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  offlinePlaceholder: {
    padding: 40,
    backgroundColor: '#fafafa',
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#777', textAlign: 'center', marginTop: 8 },
  toolsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  toolItem: { width: (width - 48 - 24) / 3, alignItems: 'center' },
  toolIcon: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  toolLabel: { fontSize: 12, color: '#444', fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40, padding: 16, marginHorizontal: 24, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' },
  logoutText: { color: '#FF5252', fontWeight: 'bold', marginLeft: 10 },
});

export default MechanicDashboard;
