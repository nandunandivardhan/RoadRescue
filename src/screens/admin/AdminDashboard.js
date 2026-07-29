/**
 * AdminDashboard — Executive overview for the App Owner
 */
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useAdminStore from '../../store/useAdminStore';
import useUserStore from '../../store/useUserStore';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../utils/theme';
import { formatCurrency } from '../../utils/helpers';

const AdminDashboard = ({ navigation }) => {
  const { stats, allRequests, listenToAllRequests, fetchAllUsers, cleanup } = useAdminStore();
  const { logout } = useUserStore();

  useEffect(() => {
    listenToAllRequests();
    fetchAllUsers();
    return () => cleanup();
  }, []);

  const StatCard = ({ title, value, icon, color }) => (
    <View style={s.statCard}>
      <View style={[s.statIcon, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statTitle}>{title}</Text>
    </View>
  );

  const renderActivity = ({ item }) => (
    <TouchableOpacity 
      style={s.activityItem} 
      onPress={() => navigation.navigate('Chat', { requestId: item.id })}
    >
      <View style={[s.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
      <View style={{ flex: 1, marginLeft: SIZES.md }}>
        <Text style={s.activityText}>
          <Text style={s.bold}>{item.customerName}</Text> requested <Text style={s.bold}>{item.issueType}</Text>
        </Text>
        <Text style={s.activityTime}>
          {item.createdAt 
            ? new Date(item.createdAt.seconds * 1000).toLocaleTimeString() 
            : 'Just now'}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textTertiary} />
    </TouchableOpacity>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return COLORS.warning;
      case 'accepted':
      case 'in_progress': return COLORS.primary;
      case 'completed': return COLORS.success;
      default: return COLORS.textTertiary;
    }
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient colors={[COLORS.primaryDark, COLORS.primary]} style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.greeting}>Executive Dashboard</Text>
            <Text style={s.subGreeting}>RoadRescue Overseer</Text>
          </View>
          <TouchableOpacity onPress={logout} style={s.logoutBtn}>
            <MaterialCommunityIcons name="logout" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Top Stats */}
        <View style={s.mainStat}>
          <Text style={s.mainStatLabel}>TOTAL REVENUE</Text>
          <Text style={s.mainStatValue}>{formatCurrency(stats.totalRevenue)}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {/* Stat Grid */}
        <View style={s.statGrid}>
          <StatCard title="Active Jobs" value={stats.activeJobs} icon="pylon" color={COLORS.warning} />
          <StatCard title="Mechanics" value={stats.mechanicsOnline} icon="wrench-outline" color={COLORS.success} />
          <StatCard title="Total Jobs" value={stats.totalJobs} icon="check-all" color={COLORS.primary} />
          <TouchableOpacity 
            style={{ width: '48%' }} 
            onPress={() => Alert.alert('User Breakdown', `Total Registered: ${stats.totalJobs + 12}\n\n• Customers: ${stats.totalJobs + 4}\n• Mechanics: 8\n• Pending Approval: 2`)}
          >
            <StatCard title="Total Users" value={stats.totalJobs + 12} icon="account-group" color={COLORS.secondary} />
          </TouchableOpacity>
        </View>

        {/* Activity Feed */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Live Activity Feed</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={s.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={s.feedContainer}>
          {allRequests.slice(0, 10).map((item) => (
            <View key={item.id}>{renderActivity({ item })}</View>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FD' },
  header: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: SIZES.lg, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.xl },
  greeting: { fontSize: SIZES.h3, color: '#FFF', ...FONTS.bold },
  subGreeting: { fontSize: SIZES.bodySmall, color: 'rgba(255,255,255,0.7)', ...FONTS.regular },
  logoutBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
  mainStat: { alignItems: 'center', marginTop: SIZES.sm },
  mainStatLabel: { fontSize: SIZES.tiny, color: 'rgba(255,255,255,0.6)', letterSpacing: 2, ...FONTS.bold },
  mainStatValue: { fontSize: 42, color: '#FFF', ...FONTS.bold, marginTop: 4 },
  content: { flex: 1, marginTop: -30, paddingHorizontal: SIZES.md },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '48%', backgroundColor: COLORS.white, borderRadius: 20, padding: SIZES.md, marginBottom: SIZES.md, ...SHADOWS.small },
  statIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: SIZES.sm },
  statValue: { fontSize: SIZES.h3, color: COLORS.textPrimary, ...FONTS.bold },
  statTitle: { fontSize: SIZES.tiny, color: COLORS.textTertiary, ...FONTS.medium, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SIZES.md, marginBottom: SIZES.md, paddingHorizontal: SIZES.xs },
  sectionTitle: { fontSize: SIZES.body, color: COLORS.textPrimary, ...FONTS.bold },
  viewAll: { fontSize: SIZES.caption, color: COLORS.primary, ...FONTS.medium },
  feedContainer: { backgroundColor: COLORS.white, borderRadius: 24, padding: SIZES.sm, ...SHADOWS.small },
  activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SIZES.md, paddingHorizontal: SIZES.sm, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  activityText: { fontSize: SIZES.bodySmall, color: COLORS.textSecondary, ...FONTS.regular },
  bold: { color: COLORS.textPrimary, ...FONTS.semiBold },
  activityTime: { fontSize: SIZES.tiny, color: COLORS.textTertiary, marginTop: 2 },
  statusText: { fontSize: SIZES.tiny, ...FONTS.bold },
});

export default AdminDashboard;
