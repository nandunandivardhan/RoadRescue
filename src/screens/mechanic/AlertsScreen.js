import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../utils/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

const AlertsScreen = ({ navigation }) => {
  const alerts = [
    { id: '1', title: 'High Demand Area', msg: 'Many requests coming from Tambaram area. Head there for more jobs!', type: 'info', time: '10m ago' },
    { id: '2', title: 'System Update', msg: 'Real-time tracking accuracy has been improved in the latest update.', type: 'update', time: '2h ago' },
    { id: '3', title: 'Payment Received', msg: 'Payment of ₹1,200 for Request #RR-9823 received.', type: 'payment', time: '5h ago' },
  ];

  const getIcon = (type) => {
    switch(type) {
      case 'payment': return 'cash-check';
      case 'update': return 'update';
      default: return 'bell-ring';
    }
  };

  return (
    <View style={s.container}>
      <SafeAreaView style={s.header} edges={['top']}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>System Alerts</Text>
        <View style={{ width: 24 }} />
      </SafeAreaView>

      <FlatList
        data={alerts}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={[s.iconBox, { backgroundColor: item.type === 'payment' ? COLORS.success + '15' : COLORS.primaryGhost }]}>
              <MaterialCommunityIcons name={getIcon(item.type)} size={24} color={item.type === 'payment' ? COLORS.success : COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <View style={s.row}>
                <Text style={s.alertTitle}>{item.title}</Text>
                <Text style={s.alertTime}>{item.time}</Text>
              </View>
              <Text style={s.alertMsg}>{item.msg}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: COLORS.surface, ...SHADOWS.small },
  title: { fontSize: 18, ...FONTS.bold, color: COLORS.textPrimary },
  list: { padding: 20 },
  card: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 16, padding: 15, marginBottom: 15, ...SHADOWS.small },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  alertTitle: { fontSize: 15, ...FONTS.bold, color: COLORS.textPrimary },
  alertTime: { fontSize: 11, ...FONTS.regular, color: COLORS.textTertiary },
  alertMsg: { fontSize: 13, ...FONTS.regular, color: COLORS.textSecondary, marginTop: 4, lineHeight: 18 },
});

export default AlertsScreen;
