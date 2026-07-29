import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../utils/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

const ServiceAreaScreen = ({ navigation }) => {
  return (
    <View style={s.container}>
      <SafeAreaView style={s.header} edges={['top']}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>Service Area</Text>
        <View style={{ width: 24 }} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.card}>
          <Text style={s.cardTitle}>Operating Radius</Text>
          <Text style={s.cardSub}>Define how far you are willing to travel for requests.</Text>
          <View style={s.radiusSelector}>
            <Text style={s.radiusValue}>25 km</Text>
            <View style={s.sliderPlaceholder}>
              <View style={s.sliderTrack} />
              <View style={s.sliderThumb} />
            </View>
          </View>
        </View>

        <View style={s.card}>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Active Cities</Text>
              <Text style={s.cardSub}>You are currently active in Chennai & Kanchipuram.</Text>
            </View>
            <MaterialCommunityIcons name="map-marker-radius" size={32} color={COLORS.primary} />
          </View>
        </View>

        <View style={s.card}>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Auto-Accept</Text>
              <Text style={s.cardSub}>Automatically accept jobs within 5km radius.</Text>
            </View>
            <Switch value={false} trackColor={{ false: '#eee', true: COLORS.primary }} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: COLORS.surface, ...SHADOWS.small },
  title: { fontSize: 18, ...FONTS.bold, color: COLORS.textPrimary },
  content: { padding: 20 },
  card: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, marginBottom: 20, ...SHADOWS.small },
  cardTitle: { fontSize: 16, ...FONTS.bold, color: COLORS.textPrimary },
  cardSub: { fontSize: 12, ...FONTS.regular, color: COLORS.textSecondary, marginTop: 4 },
  radiusSelector: { marginTop: 20, alignItems: 'center' },
  radiusValue: { fontSize: 24, ...FONTS.bold, color: COLORS.primary, marginBottom: 10 },
  sliderPlaceholder: { width: '100%', height: 4, backgroundColor: '#eee', borderRadius: 2, position: 'relative' },
  sliderTrack: { width: '60%', height: 4, backgroundColor: COLORS.primary, borderRadius: 2 },
  sliderThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.primary, position: 'absolute', top: -8, left: '60%', marginLeft: -10, ...SHADOWS.small },
  row: { flexDirection: 'row', alignItems: 'center' },
});

export default ServiceAreaScreen;
