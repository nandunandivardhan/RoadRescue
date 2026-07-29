/**
 * MapViewComponent.web.js — Web-specific version of the Map component
 * This avoids any native dependencies like react-native-maps during web builds
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS } from '../utils/theme';

const MapViewComponent = ({ 
  style,
  latitude = 17.3850,
  longitude = 78.4867
}) => {
  const mapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=14&output=embed`;

  return (
    <View style={[styles.webPlaceholder, style, { overflow: 'hidden' }]}>
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        style={{ border: 0 }}
        src={mapUrl}
        allowFullScreen
      />
    </View>
  );
};

const styles = StyleSheet.create({
  webPlaceholder: {
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    padding: SIZES.xl,
    minHeight: 200,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapIcon: {
    fontSize: 32,
  },
  webText: {
    fontSize: SIZES.h4,
    color: COLORS.textPrimary,
    ...FONTS.bold,
  },
  webSubText: {
    fontSize: SIZES.bodySmall,
    color: COLORS.textSecondary,
    ...FONTS.regular,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: '80%',
  },
  badge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: SIZES.lg,
  },
  badgeText: {
    fontSize: 10,
    color: COLORS.primary,
    ...FONTS.bold,
    letterSpacing: 1,
  }
});

export default MapViewComponent;
