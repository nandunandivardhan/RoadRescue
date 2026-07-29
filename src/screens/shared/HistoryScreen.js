import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import RequestCard from '../../components/RequestCard';
import Skeleton from '../../components/Skeleton';
import useUserStore from '../../store/useUserStore';
import useRequestStore from '../../store/useRequestStore';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../utils/theme';

const HistoryScreen = ({ navigation }) => {
  const { profile, role } = useUserStore();
  const { requestHistory, fetchHistory, isLoading } = useRequestStore();

  useEffect(() => {
    if (profile?.uid) fetchHistory(profile.uid, role);
  }, [profile?.uid]);

  const handleItemPress = (item) => {
    if (role === 'customer') {
      navigation.navigate('TrackMechanic', { requestId: item.id });
    } else {
      navigation.navigate('JobDetail', { requestId: item.id, request: item });
    }
  };

  const renderSkeletons = () => (
    <View style={s.skeletonList}>
      {[1, 2, 3, 4].map(i => (
        <View key={i} style={s.skeletonCard}>
          <View style={s.skeletonHeader}>
            <Skeleton width={44} height={44} borderRadius={12} />
            <View style={{ marginLeft: 12 }}>
              <Skeleton width={150} height={18} />
              <Skeleton width={100} height={12} style={{ marginTop: 6 }} />
            </View>
          </View>
          <View style={s.skeletonFooter}>
            <Skeleton width={80} height={14} />
            <Skeleton width={60} height={18} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>Service History</Text>
      </View>
      {isLoading && requestHistory.length === 0 ? (
        renderSkeletons()
      ) : (
        <FlatList
          data={requestHistory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RequestCard 
              request={item} 
              role={role} 
              onPress={() => handleItemPress(item)} 
            />
          )}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <View style={s.empty}>
              <MaterialCommunityIcons name="history" size={64} color={COLORS.border} />
              <Text style={s.emptyTitle}>No History Yet</Text>
              <Text style={s.emptySub}>Your completed and cancelled services will appear here</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: SIZES.base, paddingHorizontal: SIZES.screenPadding },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', marginRight: SIZES.md },
  title: { fontSize: SIZES.h3, color: COLORS.textPrimary, ...FONTS.bold },
  list: { paddingHorizontal: SIZES.screenPadding, paddingTop: SIZES.md, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: SIZES.h4, color: COLORS.textSecondary, ...FONTS.semiBold, marginTop: SIZES.base },
  emptySub: { fontSize: SIZES.bodySmall, color: COLORS.textTertiary, ...FONTS.regular, marginTop: SIZES.xs, textAlign: 'center' },
  skeletonList: { paddingHorizontal: SIZES.screenPadding, paddingTop: SIZES.md },
  skeletonCard: { backgroundColor: COLORS.surface, borderRadius: SIZES.borderRadius, padding: SIZES.base, marginBottom: SIZES.md, ...SHADOWS.small },
  skeletonHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.md },
  skeletonFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SIZES.md, paddingTop: SIZES.sm, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
});

export default HistoryScreen;
