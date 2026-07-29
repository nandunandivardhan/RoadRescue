/**
 * Google Maps / Location Service
 */
import * as Location from 'expo-location';

const addressCache = new Map();

/**
 * Request location permissions and get current position
 */
/**
 * Request location permissions and get current position with timeout/fallback
 */
export const getCurrentLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    // High accuracy can be slow on web, use a timeout
    const locationPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Location timeout')), 15000)
    );

    const location = await Promise.race([locationPromise, timeoutPromise]);

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  } catch (error) {
    console.warn('Location fetch failed, using fallback:', error.message);
    // Fallback: Hyderabad Center (or any neutral India center)
    return {
      latitude: 17.385044,
      longitude: 78.486671,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }
};

/**
 * Watch location updates in real-time
 */
export const watchLocation = async (callback) => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }

  return await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      distanceInterval: 10, // Update every 10 meters
      timeInterval: 5000,   // Or every 5 seconds
    },
    (location) => {
      callback({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    }
  );
};

/**
 * Reverse geocode coordinates to address using Google Geocoding API
 */
export const reverseGeocode = async (latitude, longitude) => {
  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  if (addressCache.has(cacheKey)) return addressCache.get(cacheKey);

  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  // 1. Try Google Geocoding API first
  if (apiKey && !apiKey.includes('mock')) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
      );
      const data = await response.json();
      if (data.status === 'OK' && data.results.length > 0) {
        const addr = data.results[0].formatted_address;
        addressCache.set(cacheKey, addr);
        return addr;
      }
    } catch (error) {
      console.log('[GoogleMaps] Reverse geocode API error:', error);
    }
  }

  // 2. Fallback to native Expo Location
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (results.length > 0) {
      const addr = results[0];
      const parts = [addr.street, addr.city, addr.region].filter(Boolean);
      const finalAddr = parts.length > 0 ? parts.join(', ') : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      addressCache.set(cacheKey, finalAddr);
      return finalAddr;
    }
  } catch (e) {
    console.log('[GoogleMaps] Expo geocode error:', e);
  }

  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
};

/**
 * Fetch real-world mechanic shops nearby using Google Places API
 */
export const fetchNearbyMechanicShops = async (latitude, longitude) => {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyC1ISFk-MLFBI4TSTinyZAzbBW4mWM9vAE";
  if (!apiKey) return [];

  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=15000&type=car_repair&key=${apiKey}`;
    console.log('Fetching nearby shops from:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK') {
      return data.results.map(shop => ({
        id: shop.place_id,
        name: shop.name,
        address: shop.vicinity,
        rating: shop.rating || 0,
        user_ratings_total: shop.user_ratings_total || 0,
        latitude: shop.geometry.location.lat,
        longitude: shop.geometry.location.lng,
        type: 'external',
        isOpen: shop.opening_hours?.open_now
      }));
    }
    
    if (data.status === 'ZERO_RESULTS') {
      console.log('No shops found in this 15km radius.');
      return [];
    }

    console.error(`Google Places API Error (${data.status}):`, data.error_message || 'No specific error message provided.');
    return [];
  } catch (error) {
    console.error('Fetch nearby shops network error:', error);
    return [];
  }
};

/**
 * Fetch directions/route between two points
 */
export const fetchRoute = async (origin, destination) => {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyC1ISFk-MLFBI4TSTinyZAzbBW4mWM9vAE";
  if (!apiKey) return [];

  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.routes.length > 0) {
      const points = data.routes[0].overview_polyline.points;
      return decodePolyline(points);
    }
    return [];
  } catch (error) {
    console.error('Fetch route error:', error);
    return [];
  }
};

/**
 * Decode Google Maps polyline string
 */
function decodePolyline(t) {
  let points = [];
  for (let step, n = 0, e = 0, o = 0, r = 0, i = 0, l = 0, a = 0, c = null, u = null; n < t.length; ) {
    for (a = 0, c = 0; ; ) if ((a = t.charCodeAt(n++) - 63), (c |= (31 & a) << l), (l += 5), a < 32) break;
    (o = 1 & c ? ~(c >> 1) : c >> 1), (r += o);
    for (l = 0, a = 0, c = 0; ; ) if ((a = t.charCodeAt(n++) - 63), (c |= (31 & a) << l), (l += 5), a < 32) break;
    (i = 1 & c ? ~(c >> 1) : c >> 1), (l = 0), (u = 1 & c ? ~(c >> 1) : c >> 1), (a = 0), (l += 5), (e += u), points.push({ latitude: r / 1e5, longitude: e / 1e5 });
  }
  return points;
}

/**
 * Geocode a text address to coordinates (Web-Safe Fallback)
 */
export const geocodeAddress = async (address) => {
  try {
    const results = await Location.geocodeAsync(address);
    if (results.length > 0) {
      return {
        latitude: results[0].latitude,
        longitude: results[0].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    return null;
  } catch (error) {
    console.error('Geocode error:', error);
    return null;
  }
};

/**
 * Get directions URL for external map apps
 */
export const getDirectionsUrl = (destLat, destLng) => {
  return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
};
