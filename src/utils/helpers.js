/**
 * Utility helpers for the RoadRescue app
 */

/**
 * Format a phone number string for display
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

/**
 * Calculate distance between two lat/lng coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if ([lat1, lon1, lat2, lon2].some(v => v === undefined || v === null || isNaN(parseFloat(v)))) return 0;
  const R = 6371; // Earth's radius in km
  const dLat = deg2rad(parseFloat(lat2) - parseFloat(lat1));
  const dLon = deg2rad(parseFloat(lon2) - parseFloat(lon1));
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(parseFloat(lat1))) * Math.cos(deg2rad(parseFloat(lat2))) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const deg2rad = (deg) => deg * (Math.PI / 180);

/**
 * Format distance for display (auto-switch between km and m)
 */
export const formatDistance = (distanceKm) => {
  if (distanceKm === undefined || distanceKm === null || isNaN(distanceKm)) return '0 km';
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
};

/**
 * Format currency value
 */
export const formatCurrency = (amount, currency = 'INR') => {
  if (amount === undefined || amount === null || isNaN(parseFloat(amount))) return `${currency} 0`;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  } catch (e) {
    return `${currency} ${amount}`;
  }
};

/**
 * Generate a random request ID
 */
export const generateRequestId = () => {
  return 'RR-' + Date.now().toString(36).toUpperCase() + '-' +
    Math.random().toString(36).substring(2, 6).toUpperCase();
};

/**
 * Get relative time string (e.g., "2 min ago")
 */
export const getRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  const now = Date.now();
  let timeMillis;
  
  if (timestamp?.toMillis) {
    timeMillis = timestamp.toMillis();
  } else if (timestamp instanceof Date) {
    timeMillis = timestamp.getTime();
  } else {
    timeMillis = parseInt(timestamp);
  }
  
  if (isNaN(timeMillis)) return '';
  
  const diff = now - timeMillis;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

/**
 * Truncate text to a max length
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Debounce function
 */
export const debounce = (func, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

/**
 * Get issue icon name from @expo/vector-icons (MaterialCommunityIcons)
 */
export const getIssueIcon = (issueType) => {
  const icons = {
    'flat_tire': 'tire',
    'battery': 'car-battery',
    'engine': 'engine',
    'fuel': 'gas-station',
    'lockout': 'car-key',
    'accident': 'car-emergency',
    'towing': 'tow-truck',
    'other': 'car-wrench',
  };
  return icons[issueType] || 'car-wrench';
};

/**
 * Get status color
 */
export const getStatusColor = (status) => {
  const colors = {
    pending: '#FFB300',
    accepted: '#2979FF',
    en_route: '#7C4DFF',
    arrived: '#00C853',
    in_progress: '#FF6B35',
    completed: '#00C853',
    cancelled: '#FF1744',
  };
  return colors[status] || '#6B7280';
};
