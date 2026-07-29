import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Linking, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../utils/theme';
import CustomButton from '../../components/CustomButton';

const SupportScreen = ({ navigation }) => {
  const supportOptions = [
    {
      id: 'call',
      title: 'Call Support',
      sub: 'Speak with our emergency agents',
      icon: 'phone',
      color: '#00C853',
      action: () => Linking.openURL('tel:+1234567890'),
    },
    {
      id: 'chat',
      title: 'Email Us',
      sub: 'Send a detailed report',
      icon: 'email',
      color: '#2979FF',
      action: () => Linking.openURL('mailto:nandunandivardhan7@gmail.com?subject=RoadRescue Support Request'),
    },
    {
      id: 'web',
      title: 'Visit Website',
      sub: 'FAQs and Documentation',
      icon: 'web',
      color: '#6200EA',
      action: () => Linking.openURL('https://roadrescue.com'),
    },
  ];

  const faqs = [
    { q: 'How long does a mechanic take to arrive?', a: 'Typically within 15-30 minutes depending on your location and traffic.' },
    { q: 'Can I cancel my request?', a: 'Yes, you can cancel before a mechanic accepts or within 2 minutes after acceptance.' },
    { q: 'Are parts included in the estimate?', a: 'No, estimates cover labor and basic arrival. Parts are charged separately.' },
  ];

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>Help & Support</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={s.banner}>
          <MaterialCommunityIcons name="headphones" size={80} color={COLORS.primary} opacity={0.1} style={s.bannerIcon} />
          <Text style={s.bannerTitle}>How can we help you?</Text>
          <Text style={s.bannerSub}>Our team is available 24/7 for emergency assistance.</Text>
        </View>

        <View style={s.optionsGrid}>
          {supportOptions.map((opt) => (
            <TouchableOpacity key={opt.id} style={s.optionCard} onPress={opt.action}>
              <View style={[s.iconBox, { backgroundColor: opt.color + '15' }]}>
                <MaterialCommunityIcons name={opt.icon} size={28} color={opt.color} />
              </View>
              <Text style={s.optionTitle}>{opt.title}</Text>
              <Text style={s.optionSub}>{opt.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionTitle}>Frequently Asked Questions</Text>
        {faqs.map((faq, i) => (
          <View key={i} style={s.faqItem}>
            <Text style={s.faqQ}>{faq.q}</Text>
            <Text style={s.faqA}>{faq.a}</Text>
          </View>
        ))}

        <View style={s.emergencyBox}>
          <Text style={s.emergencyTitle}>Immediate Emergency?</Text>
          <Text style={s.emergencySub}>For life-threatening situations, always call local emergency services first.</Text>
          <CustomButton 
            title="Call 911 / 112" 
            variant="danger" 
            onPress={() => Linking.openURL('tel:911')} 
            style={s.emergencyBtn}
          />
        </View>
        
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
  banner: { backgroundColor: COLORS.surface, borderRadius: 24, padding: 30, alignItems: 'center', marginBottom: 30, overflow: 'hidden' },
  bannerIcon: { position: 'absolute', right: -20, top: -20 },
  bannerTitle: { fontSize: 22, ...FONTS.bold, color: COLORS.textPrimary, textAlign: 'center' },
  bannerSub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 },
  optionsGrid: { marginBottom: 30 },
  optionCard: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 20, padding: 16, marginBottom: 16, alignItems: 'center', ...SHADOWS.small },
  iconBox: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  optionTitle: { fontSize: 16, ...FONTS.bold, color: COLORS.textPrimary },
  optionSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 18, ...FONTS.bold, color: COLORS.textPrimary, marginBottom: 16 },
  faqItem: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 12 },
  faqQ: { fontSize: 15, ...FONTS.semiBold, color: COLORS.textPrimary },
  faqA: { fontSize: 13, color: COLORS.textSecondary, marginTop: 8, lineHeight: 20 },
  emergencyBox: { backgroundColor: '#FF174410', borderRadius: 20, padding: 20, marginTop: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#FF1744' },
  emergencyTitle: { fontSize: 18, ...FONTS.bold, color: '#FF1744', textAlign: 'center' },
  emergencySub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 16 },
  emergencyBtn: { width: '100%' },
});

export default SupportScreen;
