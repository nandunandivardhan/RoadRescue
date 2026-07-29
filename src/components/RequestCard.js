/**
 * RequestCard — Service request summary card
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';
import { getIssueIcon, getStatusColor, getRelativeTime, formatCurrency } from '../utils/helpers';

const RequestCard = ({ request, onPress, role = 'customer', showActions = false }) => {
  const statusColor = getStatusColor(request.status);
  const issueIcon = getIssueIcon(request.issueType);

  const statusLabels = {
    pending: 'Searching...',
    accepted: 'Mechanic Assigned',
    en_route: 'On the Way',
    arrived: 'Mechanic Arrived',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Status indicator strip */}
      <View style={[styles.statusStrip, { backgroundColor: statusColor }]} />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={[styles.iconBadge, { backgroundColor: statusColor + '18' }]}>
            <MaterialCommunityIcons
              name={issueIcon}
              size={24}
              color={statusColor}
            />
          </View>
          <View style={styles.headerText}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.issueType}>
                {(request.issueType || 'Service').replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </Text>
              {request.priority === 'emergency' && (
                <View style={{ backgroundColor: '#FF174418', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6 }}>
                  <Text style={{ color: '#FF1744', fontSize: 10, fontWeight: 'bold' }}>SOS</Text>
                </View>
              )}
            </View>
            <Text style={styles.requestId}>
              {request.requestId || `#${request.id?.slice(0, 8)}`}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabels[request.status] || request.status}
            </Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.textTertiary} />
          <Text style={styles.infoText} numberOfLines={1}>
            {request.locationAddress || 'Location unavailable'}
          </Text>
        </View>

        {/* Mechanic or Customer info based on role */}
        {role === 'customer' && request.mechanicName && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account-wrench" size={16} color={COLORS.textTertiary} />
            <Text style={styles.infoText}>{request.mechanicName}</Text>
          </View>
        )}

        {role === 'mechanic' && request.customerName && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account" size={16} color={COLORS.textTertiary} />
            <Text style={styles.infoText}>{request.customerName}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.time}>{getRelativeTime(request.createdAt)}</Text>
            {request.rating && (
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map(s => {
                  const score = typeof request.rating === 'object' ? (request.rating.score || request.rating.rating) : request.rating;
                  return (
                    <MaterialCommunityIcons 
                      key={s} 
                      name={s <= score ? "star" : "star-outline"} 
                      size={12} 
                      color={s <= score ? "#FFD700" : COLORS.border} 
                    />
                  );
                })}
              </View>
            )}
          </View>
          {request.estimatedCost > 0 && (
            <Text style={styles.cost}>
              {formatCurrency(request.estimatedCost)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    marginBottom: SIZES.md,
    flexDirection: 'row',
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  statusStrip: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: SIZES.base,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  issueType: {
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
    ...FONTS.semiBold,
  },
  requestId: {
    fontSize: SIZES.caption,
    color: COLORS.textTertiary,
    marginTop: 2,
    ...FONTS.regular,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.borderRadiusFull,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: SIZES.xs,
  },
  statusText: {
    fontSize: SIZES.tiny,
    ...FONTS.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  infoText: {
    fontSize: SIZES.bodySmall,
    color: COLORS.textSecondary,
    marginLeft: SIZES.sm,
    flex: 1,
    ...FONTS.regular,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.xs,
    paddingTop: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  time: {
    fontSize: SIZES.caption,
    color: COLORS.textTertiary,
    ...FONTS.regular,
  },
  cost: {
    fontSize: SIZES.body,
    color: COLORS.primary,
    ...FONTS.bold,
  },
  ratingRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
});

export default RequestCard;
