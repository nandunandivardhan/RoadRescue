import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../utils/theme';
import CustomButton from '../../components/CustomButton';

const MembershipScreen = ({ navigation }) => {
  const plans = [
    {
      id: 'bronze',
      title: 'Bronze',
      price: 'Free',
      color: '#CD7F32',
      features: ['24/7 Support', 'Standard Response Time', 'Pay-per-service'],
      active: false,
    },
    {
      id: 'gold',
      title: 'Gold',
      price: '$9.99/mo',
      color: '#FFD700',
      features: ['Priority Response', 'Free Towing (up to 10km)', 'Fuel Delivery', 'Battery Jumpstart included', '15% Discount on parts'],
      active: true,
    },
    {
      id: 'platinum',
      title: 'Platinum',
      price: '$19.99/mo',
      color: '#E5E4E2',
      features: ['Immediate Priority', 'Unlimited Towing', 'Full Roadside Coverage', 'Monthly Health Check', '25% Discount on parts'],
      active: false,
    },
  ];

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>Membership</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={s.heroCard}>
          <LinearGradient colors={['#FFD700', '#FFB300']} style={s.heroGradient}>
            <View style={s.badge}>
              <MaterialCommunityIcons name="star" size={24} color="#fff" />
            </View>
            <Text style={s.heroTitle}>Gold Member</Text>
            <Text style={s.heroSub}>Active since Feb 2026 • Valid until Feb 2027</Text>
            <View style={s.perkRow}>
              <View style={s.perk}>
                <Text style={s.perkVal}>15%</Text>
                <Text style={s.perkLab}>Discount</Text>
              </View>
              <View style={s.vDivider} />
              <View style={s.perk}>
                <Text style={s.perkVal}>Priority</Text>
                <Text style={s.perkLab}>Dispatch</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <Text style={s.sectionTitle}>Upgrade Your Plan</Text>
        
        {plans.map((plan) => (
          <TouchableOpacity key={plan.id} style={[s.planCard, plan.active && s.activePlan]}>
            <View style={[s.planColor, { backgroundColor: plan.color }]} />
            <View style={s.planInfo}>
              <View style={s.planRow}>
                <Text style={s.planTitle}>{plan.title}</Text>
                <Text style={s.planPrice}>{plan.price}</Text>
              </View>
              {plan.features.map((f, i) => (
                <View key={i} style={s.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                  <Text style={s.featureText}>{f}</Text>
                </View>
              ))}
            </View>
            {plan.active && (
              <View style={s.activeBadge}>
                <Text style={s.activeText}>Current</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <CustomButton title="Manage Subscription" style={s.manageBtn} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: SIZES.h3, color: COLORS.textPrimary, ...FONTS.bold, marginLeft: 15 },
  content: { padding: 20 },
  heroCard: { borderRadius: 24, overflow: 'hidden', ...SHADOWS.medium, marginBottom: 30 },
  heroGradient: { padding: 24, alignItems: 'center' },
  badge: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroTitle: { fontSize: 24, color: '#fff', ...FONTS.bold },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  perkRow: { flexDirection: 'row', marginTop: 24, width: '100%', justifyContent: 'space-around' },
  perk: { alignItems: 'center' },
  perkVal: { fontSize: 18, color: '#fff', ...FONTS.bold },
  perkLab: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  vDivider: { width: 1, height: '80%', backgroundColor: 'rgba(255,255,255,0.3)' },
  sectionTitle: { fontSize: 18, ...FONTS.bold, color: COLORS.textPrimary, marginBottom: 16 },
  planCard: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 20, padding: 16, marginBottom: 16, ...SHADOWS.small, borderWidth: 2, borderColor: 'transparent' },
  activePlan: { borderColor: '#FFD700' },
  planColor: { width: 4, borderRadius: 2, marginRight: 16 },
  planInfo: { flex: 1 },
  planRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  planTitle: { fontSize: 18, ...FONTS.bold, color: COLORS.textPrimary },
  planPrice: { fontSize: 16, ...FONTS.semiBold, color: COLORS.primary },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  featureText: { fontSize: 13, color: COLORS.textSecondary, marginLeft: 8 },
  activeBadge: { position: 'absolute', top: -10, right: 10, backgroundColor: '#FFD700', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  activeText: { fontSize: 10, color: '#fff', ...FONTS.bold },
  manageBtn: { marginTop: 20 },
});

export default MembershipScreen;
