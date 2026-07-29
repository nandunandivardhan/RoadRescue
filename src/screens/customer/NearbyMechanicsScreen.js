import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Animated,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import MapViewComponent from '../../components/MapViewComponent';
import CustomButton from '../../components/CustomButton';
import useRequestStore from '../../store/useRequestStore';
import { COLORS, SHADOWS, FONTS, SIZES } from '../../utils/theme';
import { calculateDistance } from '../../utils/helpers';
import { getDirectionsUrl } from '../../services/googleMaps';

const { width, height } = Dimensions.get('window');

const NearbyMechanicsScreen = ({ navigation, route }) => {
  const { location, issueLabel, issueType } = route.params;
  const { onlineMechanics, listenToOnlineMechanics } = useRequestStore();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState(null);
  const [searchStatus, setSearchStatus] = useState('Initializing search...');

  useEffect(() => {
    setLoading(true);
    setSearchStatus('Connecting to RoadRescue network...');
    const unsub = listenToOnlineMechanics();
    
    // Simulate initial search delay
    const timer = setTimeout(() => {
      setLoading(false);
      setSearchStatus('Network active');
    }, 1500);

    return () => {
      if (unsub) unsub();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    // Merge Firestore mechanics into shops list
    if (onlineMechanics) {
      const filtered = onlineMechanics.filter(m => {
        if (!m.location) return false;
        const dist = calculateDistance(
          location.latitude, location.longitude,
          m.location.latitude, m.location.longitude
        );
        return dist <= 25; // 25km radius
      }).map(m => ({
        id: m.uid,
        name: m.name,
        address: m.address || 'Verified Mobile Mechanic',
        latitude: m.location.latitude,
        longitude: m.location.longitude,
        rating: m.rating || 5.0,
        user_ratings_total: m.totalReviews || 0,
        type: 'pro',
        isOpen: true,
        phone: m.phoneNumber
      }));
      
      setShops(filtered);
      setSearchStatus(filtered.length > 0 
        ? `Found ${filtered.length} mechanics near you` 
        : 'No mechanics found in this area');
    }
  }, [onlineMechanics]);

  const loadShops = () => {
    // Just trigger a refresh of status
    setSearchStatus('Refreshing discovery...');
    setTimeout(() => setSearchStatus(`${shops.length} mechanics active`), 1000);
  };

  const handleNavigate = (shop) => {
    const url = getDirectionsUrl(shop.latitude, shop.longitude);
    Linking.openURL(url);
  };

  const renderShopItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.shopCard, selectedShop?.id === item.id && styles.selectedCard]} 
      onPress={() => setSelectedShop(item)}
    >
      <View style={[styles.shopIcon, { backgroundColor: item.type === 'pro' ? '#FFF9C4' : '#F5F5F5' }]}>
        <MaterialCommunityIcons 
          name={item.type === 'pro' ? "shield-check" : "wrench-clock"} 
          size={24} 
          color={item.type === 'pro' ? "#FBC02D" : "#666"} 
        />
      </View>
      <View style={styles.shopInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.shopName} numberOfLines={1}>{item.name}</Text>
          {item.type === 'pro' && <View style={styles.proBadge}><Text style={styles.proText}>PRO</Text></View>}
        </View>
        <Text style={styles.shopAddr} numberOfLines={1}>{item.address}</Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>{item.rating} ({item.user_ratings_total})</Text>
          {item.isOpen && <Text style={styles.openText}>• Active</Text>}
        </View>
      </View>
      <TouchableOpacity style={styles.navBtn} onPress={() => handleNavigate(item)}>
        <Ionicons name="navigate-circle" size={28} color="#FFD700" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Map Section */}
      <View style={styles.mapContainer}>
        <MapViewComponent 
          region={{
            ...location,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          }}
          markers={shops}
          style={StyleSheet.absoluteFill}
        />
        
        <SafeAreaView style={styles.mapOverlay} edges={['top']}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.searchHeader}>
            <Text style={styles.searchTitle}>{issueLabel}</Text>
            <Text style={styles.searchSub}>{searchStatus}</Text>
          </View>
        </SafeAreaView>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>Searching Real Shops...</Text>
          </View>
        )}
      </View>

      {/* List Section */}
      <View style={styles.listSection}>
        <View style={styles.listHandle} />
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Nearby Mechanics</Text>
          <TouchableOpacity onPress={loadShops} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={shops}
          keyExtractor={(item) => item.id}
          renderItem={renderShopItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading && (
              <View style={styles.empty}>
                <MaterialCommunityIcons name="map-marker-off" size={48} color="#ddd" />
                <Text style={styles.emptyTitle}>No Mechanics Found</Text>
                <Text style={styles.emptySub}>We couldn't find any shops within 15km. Try adjusting your location.</Text>
              </View>
            )
          }
        />

        <View style={styles.footer}>
          <CustomButton 
            title="Request On-Site Help" 
            onPress={() => navigation.navigate('RequestHelp', route.params)}
            icon="car-wrench"
          />
          <Text style={styles.footerHint}>A RoadRescue Pro will arrive in 15-30 mins</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  mapContainer: { height: '50%' },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 0,
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
  searchHeader: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 12,
    borderRadius: 12,
    ...SHADOWS.small,
  },
  searchTitle: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  searchSub: { fontSize: 12, color: '#666' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { color: '#fff', marginTop: 12, fontWeight: '600' },
  listSection: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  listHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  listTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },
  refreshBtn: { padding: 8 },
  shopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  selectedCard: { borderColor: '#FFD700', backgroundColor: '#FFFDF0' },
  shopIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopInfo: { flex: 1, marginLeft: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  shopName: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
  proBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  proText: { fontSize: 9, fontWeight: '900', color: '#000' },
  shopAddr: { fontSize: 12, color: '#666', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { fontSize: 12, color: '#444', marginLeft: 4 },
  openText: { fontSize: 12, color: '#4CAF50', fontWeight: 'bold', marginLeft: 8 },
  navBtn: { padding: 4 },
  listContent: { paddingBottom: 20 },
  footer: { paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  footerHint: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 8 },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 12 },
  emptySub: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
});

export default NearbyMechanicsScreen;
