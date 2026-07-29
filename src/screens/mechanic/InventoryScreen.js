import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../utils/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

const InventoryScreen = ({ navigation }) => {
  const items = [
    { id: '1', name: 'Standard Car Battery', stock: 5, price: '₹4,500', icon: 'battery-positive' },
    { id: '2', name: 'Universal Tire Plug Kit', stock: 12, price: '₹350', icon: 'wrench' },
    { id: '3', name: 'Engine Oil (5L)', stock: 8, price: '₹2,200', icon: 'oil' },
    { id: '4', name: 'Hydraulic Jack', stock: 2, price: '₹1,800', icon: 'car-lift-high' },
  ];

  return (
    <View style={s.container}>
      <SafeAreaView style={s.header} edges={['top']}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>Tools & Inventory</Text>
        <TouchableOpacity>
          <MaterialCommunityIcons name="plus" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </SafeAreaView>

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.iconBox}>
              <MaterialCommunityIcons name={item.icon} size={28} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={s.itemName}>{item.name}</Text>
              <Text style={s.itemStock}>{item.stock} units in stock</Text>
            </View>
            <Text style={s.itemPrice}>{item.price}</Text>
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
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 16, padding: 15, marginBottom: 15, ...SHADOWS.small },
  iconBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: COLORS.primaryGhost, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 15, ...FONTS.bold, color: COLORS.textPrimary },
  itemStock: { fontSize: 12, ...FONTS.regular, color: COLORS.textSecondary, marginTop: 2 },
  itemPrice: { fontSize: 15, ...FONTS.bold, color: COLORS.success },
});

export default InventoryScreen;
