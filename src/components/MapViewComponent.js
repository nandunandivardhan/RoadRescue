/**
 * MapViewComponent — Google Maps wrapper with markers and route display
 * Conditionally loads react-native-maps only on native platforms
 */
import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, Animated } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

let MapView, Marker, PROVIDER_GOOGLE, Polyline;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Polyline = Maps.Polyline;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  } catch (e) {
    console.log('Maps failed to load on native');
  }
}

// Support for Marker.Animated
const AnimatedMarker = Marker && Marker.Animated ? Marker.Animated : Marker;

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.015;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const MapViewComponent = ({
  region,
  markers = [],
  userLocation,
  mechanicLocation,
  customerLocation,
  routePoints = [],
  style,
  onRegionChange,
  scrollEnabled = true,
  zoomEnabled = true,
  showsUserLocation = true,
  children,
}) => {
  const mapRef = React.useRef(null);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Auto-focus logic
  React.useEffect(() => {
    if (Platform.OS === 'web' || !mapRef.current) return;

    const coords = [];
    if (mechanicLocation?.latitude) coords.push({ latitude: parseFloat(mechanicLocation.latitude), longitude: parseFloat(mechanicLocation.longitude) });
    if (customerLocation?.latitude) coords.push({ latitude: parseFloat(customerLocation.latitude), longitude: parseFloat(customerLocation.longitude) });
    
    if (coords.length >= 2) {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
        animated: true,
      });
    } else if (coords.length === 1 && !region) {
      mapRef.current.animateToRegion({
        ...coords[0],
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    }
  }, [mechanicLocation, customerLocation, markers]);
  
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.webPlaceholder, style]}>
        <View style={styles.webIconContainer}>
          <MaterialCommunityIcons name="map-search" size={40} color={COLORS.primary} />
        </View>
        <Text style={styles.webText}>Real-World Discovery Active</Text>
        <Text style={styles.webSubText}>Searching real mechanic shops across India</Text>
        <View style={styles.mobileBadge}><Text style={styles.mobileBadgeText}>MOBILE OPTIMIZED</Text></View>
      </View>
    );
  }

  if (!MapView) {
    return <View style={[styles.webPlaceholder, style]}><Text>Loading Maps...</Text></View>;
  }

  const defaultRegion = region || {
    latitude: 17.385044,  // Default: Hyderabad
    longitude: 78.486671,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={defaultRegion}
        onRegionChangeComplete={onRegionChange}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={false}
        scrollEnabled={scrollEnabled}
        zoomEnabled={zoomEnabled}
        showsCompass={false}
        customMapStyle={mapStyle}
        loadingEnabled={true}
      >
        {/* Custom markers */}
        {markers.map((marker, index) => {
          const lat = parseFloat(marker.latitude);
          const lng = parseFloat(marker.longitude);
          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker
              key={marker.id || index}
              coordinate={{
                latitude: lat,
                longitude: lng,
              }}
              title={marker.title || marker.name}
              description={marker.description || marker.address}
              pinColor={marker.type === 'external' ? COLORS.secondary : (marker.color || COLORS.primary)}
            />
          );
        })}

        {/* Mechanic marker */}
        {mechanicLocation && !isNaN(parseFloat(mechanicLocation.latitude)) && !isNaN(parseFloat(mechanicLocation.longitude)) && (
          <AnimatedMarker
            coordinate={{
              latitude: parseFloat(mechanicLocation.latitude),
              longitude: parseFloat(mechanicLocation.longitude),
            }}
            title="Mechanic"
            description="Your mechanic is here"
          >
            <Animated.View style={[styles.mechanicMarker, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.mechanicMarkerInner}>
                <View style={styles.mechanicDot} />
              </View>
            </Animated.View>
          </AnimatedMarker>
        )}

        {/* Customer marker (for mechanic dashboard) */}
        {customerLocation && !isNaN(parseFloat(customerLocation.latitude)) && !isNaN(parseFloat(customerLocation.longitude)) && (
          <Marker
            coordinate={{
              latitude: parseFloat(customerLocation.latitude),
              longitude: parseFloat(customerLocation.longitude),
            }}
            title="Customer"
            description="Vehicle location"
          >
            <View style={styles.customerMarker}>
              <MaterialCommunityIcons name="car-alert" size={20} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Route Polyline */}
        {routePoints.length > 0 && (
          <Polyline
            coordinates={routePoints}
            strokeColor={COLORS.primary}
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}

        {children}
      </MapView>
    </View>
  );
};

// Subtle custom map styling
const mapStyle = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#DDE6F0' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [{ color: '#F0E6D4' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#F5EBDE' }],
  },
];

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: SIZES.borderRadius,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mechanicMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.locationPulse || 'rgba(255,107,53,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mechanicMarkerInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  mechanicDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  customerMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    ...SHADOWS.medium,
  },
  webPlaceholder: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: '#EEE',
    height: 200,
  },
  webIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryGhost,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  webText: {
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
    ...FONTS.bold,
  },
  webSubText: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    ...FONTS.regular,
    marginTop: 4,
  },
  mobileBadge: {
    marginTop: 16,
    backgroundColor: 'rgba(255,107,53,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.2)',
  },
  mobileBadgeText: {
    fontSize: 10,
    color: COLORS.primary,
    ...FONTS.bold,
    letterSpacing: 1,
  }
});

export default MapViewComponent;
