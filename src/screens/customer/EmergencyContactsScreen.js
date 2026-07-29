import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, FlatList, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useUserStore from '../../store/useUserStore';
import CustomButton from '../../components/CustomButton';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../utils/theme';

const EmergencyContactsScreen = ({ navigation }) => {
  const { emergencyContacts, fetchEmergencyContacts, addEmergencyContact, removeEmergencyContact } = useUserStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchEmergencyContacts();
  }, []);

  const handleAdd = async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    // 1. Empty field validation
    if (!trimmedName || !trimmedPhone) {
      Alert.alert('Validation Error', 'Please enter both name and phone number.');
      return;
    }
    
    // 2. Trim and clean phone input for duplicate and pattern validations
    const cleanPhone = trimmedPhone.replace(/[-\s\(\)\.]/g, '');
    
    // 3. Invalid phone rejection (Require 7 to 15 digits, allowing optional + prefix)
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    if (!phoneRegex.test(cleanPhone)) {
      Alert.alert('Validation Error', 'Please enter a valid phone number (7 to 15 digits).');
      return;
    }

    // 4. Max 5 contacts validation
    if (emergencyContacts.length >= 5) {
      Alert.alert('Limit Reached', 'You can add a maximum of 5 emergency contacts.');
      return;
    }

    // 5. Duplicate phone prevention
    const isDuplicate = emergencyContacts.some(c => {
      const cleanExisting = c.phone.replace(/[-\s\(\)\.]/g, '');
      return cleanExisting === cleanPhone;
    });

    if (isDuplicate) {
      Alert.alert('Duplicate Contact', 'This phone number is already registered in your emergency contacts.');
      return;
    }

    setIsAdding(true);
    try {
      const result = await addEmergencyContact({ name: trimmedName, phone: trimmedPhone });
      if (result.success) {
        setName('');
        setPhone('');
        Alert.alert('Success', 'Emergency contact added successfully.');
      } else {
        Alert.alert('Error', result.error || 'Failed to add contact.');
      }
    } catch (err) {
      console.error('[EmergencyContacts] Add handler failed:', err);
      Alert.alert('Error', 'An unexpected network error occurred.');
    } finally {
      setIsAdding(false); // Guarantees spinner stops in all cases (Requirement 4)
    }
  };

  const handleRemove = (contactId, contactName) => {
    Alert.alert(
      'Remove Contact',
      `Are you sure you want to remove ${contactName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            const result = await removeEmergencyContact(contactId);
            if (!result.success) Alert.alert('Error', result.error);
          }
        }
      ]
    );
  };

  const renderContact = ({ item }) => (
    <View style={s.contactCard}>
      <View style={s.contactAvatar}>
        <Text style={s.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={s.contactInfo}>
        <Text style={s.contactName}>{item.name}</Text>
        <Text style={s.contactPhone}>{item.phone}</Text>
      </View>
      <TouchableOpacity style={s.deleteBtn} onPress={() => handleRemove(item.id, item.name)}>
        <MaterialCommunityIcons name="trash-can-outline" size={24} color={COLORS.danger} />
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>Emergency Contacts</Text>
      </View>

      {/* Info Banner */}
      <View style={s.infoBanner}>
        <MaterialCommunityIcons name="shield-alert-outline" size={20} color={COLORS.primary} />
        <Text style={s.infoText}>
          These contacts will be notified automatically with your live location when you trigger an SOS.
        </Text>
      </View>

      {/* Add New Form */}
      {emergencyContacts.length < 5 ? (
        <View style={s.addForm}>
          <Text style={s.formTitle}>Add New Contact ({emergencyContacts.length}/5)</Text>
          <View style={s.inputRow}>
            <TextInput
              style={[s.input, { flex: 1, marginRight: SIZES.sm }]}
              placeholder="Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <TextInput
              style={[s.input, { flex: 1.5 }]}
              placeholder="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
          <CustomButton 
            title="Add Contact" 
            onPress={handleAdd} 
            loading={isAdding} 
            disabled={isAdding}
            icon="plus" 
            size="small"
            style={{ marginTop: SIZES.sm }}
          />
        </View>
      ) : (
        <View style={[s.infoBanner, { backgroundColor: COLORS.surface, marginTop: SIZES.sm }]}>
          <Text style={[s.infoText, { color: COLORS.textSecondary }]}>
            You have reached the maximum limit of 5 emergency contacts.
          </Text>
        </View>
      )}

      {/* List */}
      <FlatList
        data={emergencyContacts}
        keyExtractor={item => item.id}
        renderItem={renderContact}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <MaterialCommunityIcons name="account-group-outline" size={60} color={COLORS.border} />
            <Text style={s.emptyTitle}>No Contacts Yet</Text>
            <Text style={s.emptyText}>Add trusted people to notify during emergencies.</Text>
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: SIZES.base, paddingHorizontal: SIZES.screenPadding },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', marginRight: SIZES.md, ...SHADOWS.small },
  title: { fontSize: SIZES.h2, color: COLORS.textPrimary, ...FONTS.bold },
  infoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryGhost, padding: SIZES.md, marginHorizontal: SIZES.screenPadding, marginTop: SIZES.md, borderRadius: SIZES.borderRadiusSm },
  infoText: { flex: 1, marginLeft: SIZES.sm, fontSize: SIZES.caption, color: COLORS.primaryDark, ...FONTS.medium, lineHeight: 18 },
  addForm: { marginHorizontal: SIZES.screenPadding, marginTop: SIZES.xl, backgroundColor: COLORS.surface, padding: SIZES.md, borderRadius: SIZES.borderRadius, ...SHADOWS.small },
  formTitle: { fontSize: SIZES.bodySmall, color: COLORS.textSecondary, ...FONTS.semiBold, marginBottom: SIZES.sm },
  inputRow: { flexDirection: 'row' },
  input: { height: 48, backgroundColor: COLORS.background, borderRadius: SIZES.borderRadiusSm, paddingHorizontal: SIZES.md, fontSize: SIZES.bodySmall, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.borderLight, ...FONTS.regular },
  list: { padding: SIZES.screenPadding, paddingTop: SIZES.xl },
  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: SIZES.md, borderRadius: SIZES.borderRadius, marginBottom: SIZES.md, ...SHADOWS.small },
  contactAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: SIZES.h4, color: COLORS.white, ...FONTS.bold },
  contactInfo: { flex: 1, marginLeft: SIZES.md },
  contactName: { fontSize: SIZES.body, color: COLORS.textPrimary, ...FONTS.semiBold },
  contactPhone: { fontSize: SIZES.caption, color: COLORS.textSecondary, ...FONTS.regular, marginTop: 2 },
  deleteBtn: { padding: SIZES.xs },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: SIZES.h4, color: COLORS.textPrimary, ...FONTS.semiBold, marginTop: SIZES.md },
  emptyText: { fontSize: SIZES.bodySmall, color: COLORS.textSecondary, textAlign: 'center', marginTop: SIZES.xs, paddingHorizontal: 40 },
});

export default EmergencyContactsScreen;
