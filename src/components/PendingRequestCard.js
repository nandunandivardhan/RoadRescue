import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SIZES, FONTS } from '../utils/theme';
import { formatCurrency, calculateDistance } from '../utils/helpers';

const PendingRequestCard = ({ request, mechanicLocation, onAccept, onReject }) => {
  const distance = mechanicLocation 
    ? calculateDistance(mechanicLocation.latitude, mechanicLocation.longitude, request.locationLat, request.locationLng)
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.issueIconContainer}>
          <MaterialCommunityIcons name="car-alert" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.issueType}>{request.issueType?.replace('_', ' ').toUpperCase()}</Text>
          <Text style={styles.customerName}>{request.customerName}</Text>
        </View>
        <View style={styles.estimateBadge}>
          <Text style={styles.estimateText}>{formatCurrency(request.estimatedCost)}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color={COLORS.textTertiary} />
          <Text style={styles.detailText} numberOfLines={1}>{request.locationAddress}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="car" size={16} color={COLORS.textTertiary} />
          <Text style={styles.detailText}>{request.vehicleInfo}</Text>
        </View>
        {distance !== null && (
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="map-marker-distance" size={16} color={COLORS.primary} />
            <Text style={[styles.detailText, { color: COLORS.primary, fontWeight: 'bold' }]}>
              {distance.toFixed(1)} km away
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.rejectBtn} onPress={() => onReject(request.id)}>
          <Text style={styles.rejectText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptBtn} onPress={() => onAccept(request)}>
          <Text style={styles.acceptText}>Accept Job</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  issueIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  issueType: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  estimateBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  estimateText: {
    color: '#2E7D32',
    fontWeight: 'bold',
    fontSize: 14,
  },
  details: {
    marginBottom: 16,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectText: {
    color: '#666',
    fontWeight: 'bold',
  },
  acceptBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PendingRequestCard;
