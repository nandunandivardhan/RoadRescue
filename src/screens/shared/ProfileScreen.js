import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef
} from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity, Alert, Modal, TextInput, Linking, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import CustomButton from '../../components/CustomButton';
import useUserStore from '../../store/useUserStore';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../utils/theme';

const ProfileScreen = ({ navigation }) => {
  const { profile, role, updateProfile, logout } = useUserStore();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newName, setNewName] = useState(profile?.name || '');
  const [newPhone, setNewPhone] = useState(profile?.phone || profile?.phoneNumber || '');
  const [newEmergencyContact, setNewEmergencyContact] = useState(profile?.emergencyContact || '');
  const [newVehicleInfo, setNewVehicleInfo] = useState(profile?.vehicleInfo || '');
  const [newSpecialty, setNewSpecialty] = useState(profile?.specialty || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoContent, setInfoContent] = useState({ title: '', body: '', icon: '' });
  const [tempAvatar, setTempAvatar] = useState(profile?.avatarUrl || profile?.avatar || '');

  useEffect(() => {
    if (profile) {
      setTempAvatar(profile.avatarUrl || profile.avatar || '');
    }
  }, [profile]);

  const handleSelectAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need gallery permissions to select a profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true
      });

      if (result.canceled) {
        console.log('User cancelled image selection.');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (!asset.uri || !asset.base64) {
          Alert.alert('Invalid File', 'The selected file is invalid or corrupted. Please pick another photo.');
          return;
        }

        const base64Data = `data:image/jpeg;base64,${asset.base64}`;
        
        // Enforce 150KB size check
        if (base64Data.length > 150 * 1024 * 1.33) {
          Alert.alert('Image Too Large', 'Please choose a simpler or smaller image under 150KB.');
          return;
        }

        setTempAvatar(base64Data);
        
        // Immediately save the photo so it persists and syncs with Firestore
        const updates = {
          avatar: base64Data,
          avatarUrl: base64Data
        };
        const success = await updateProfile(updates);
        if (success) {
          Alert.alert('Success', 'Profile photo updated successfully!');
        } else {
          Alert.alert('Error', 'Failed to save profile photo.');
        }
      }
    } catch (err) {
      console.error('Image picking error:', err);
      Alert.alert('Error', 'An error occurred while picking the image.');
    }
  };

  useEffect(() => {
    if (editModalVisible && profile) {
      setNewName(profile.name || '');
      setNewPhone(profile.phone || profile.phoneNumber || '');
      setNewEmergencyContact(profile.emergencyContact || '');
      setNewVehicleInfo(profile.vehicleInfo || '');
      setNewSpecialty(profile.specialty || '');
    }
  }, [editModalVisible, profile]);

  const showInfo = (title, body, icon) => {
    setInfoContent({ title, body, icon });
    setInfoModalVisible(true);
  };

  const handleUpdateProfile = async () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    if (!newPhone.trim()) {
      Alert.alert('Error', 'Phone number cannot be empty.');
      return;
    }
    setIsUpdating(true);
    const updates = { 
      name: newName, 
      phone: newPhone, 
      phoneNumber: newPhone 
    };
    if (role === 'customer') {
      updates.emergencyContact = newEmergencyContact;
      updates.vehicleInfo = newVehicleInfo;
    } else {
      updates.specialty = newSpecialty;
    }
    
    const success = await updateProfile(updates);
    setIsUpdating(false);
    if (success) {
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } else {
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleSwitchRole = async () => {
    const newRole = role === 'customer' ? 'mechanic' : 'customer';
    Alert.alert(
      'Switch Role (Dev Mode)',
      `Are you sure you want to switch to ${newRole.toUpperCase()} role?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Switch Now', 
          onPress: async () => {
            setIsUpdating(true);
            await updateProfile({ role: newRole });
            setIsUpdating(false);
            Alert.alert('Role Updated', `You are now a ${newRole}. The app will reload your dashboard.`);
          } 
        },
      ]
    );
  };

  const menuItems = [
    { icon: 'account-edit', label: 'Edit Profile', onPress: () => setEditModalVisible(true) },
    { icon: 'car', label: 'My Vehicles', onPress: () => navigation.navigate('MyVehicles'), show: role === 'customer' },
    { icon: 'star', label: 'Ratings & Reviews', onPress: () => navigation.navigate('History'), show: role === 'mechanic' },
    { icon: 'shield-account', label: 'Emergency Contacts', onPress: () => navigation.navigate('EmergencyContacts'), show: role === 'customer' },
    { icon: 'cached', label: `Switch to ${role === 'customer' ? 'Mechanic' : 'Customer'}`, onPress: handleSwitchRole },
    { 
      icon: 'bell-outline', 
      label: 'Notifications', 
      onPress: () => showInfo(
        'Notifications', 
        '• Welcome to RoadRescue! Your profile is verified.\n• Tip: Add your primary vehicle to the garage for faster help.\n• Security: Your login from a new device was successful.',
        'bell-ring'
      ) 
    },
    { 
      icon: 'shield-check', 
      label: 'Privacy & Security', 
      onPress: () => showInfo(
        'Security', 
        'Your data is protected with AES-256 encryption. We never share your location data unless you are actively requesting assistance.',
        'shield-lock'
      ) 
    },
    { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => Linking.openURL('mailto:nandunandivardhan7@gmail.com?subject=RoadRescue Support Request') },
    { 
      icon: 'information-outline', 
      label: 'About RoadRescue', 
      onPress: () => showInfo(
        'RoadRescue v1.0.0', 
        'Designed for ultimate roadside peace of mind. Our mission is to connect drivers with professional help in minutes, anywhere, anytime.',
        'rocket-launch'
      ) 
    },
  ].filter(item => item.show !== false);

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[role === 'mechanic' ? COLORS.secondary : COLORS.primary, role === 'mechanic' ? COLORS.secondaryDark : COLORS.primaryDark]} style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={s.avatarContainer}>
            <TouchableOpacity style={s.avatarTouchable} onPress={handleSelectAvatar} activeOpacity={0.8}>
              {tempAvatar ? (
                <Image 
                  source={{ uri: tempAvatar }} 
                  style={s.avatarImage} 
                  onError={() => {
                    console.log('Avatar failed to load. Falling back to initials.');
                    setTempAvatar('');
                  }}
                />
              ) : (
                <View style={s.avatarPlaceholder}>
                  <Text style={s.avatarText}>
                    {(profile?.name || 'User').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={s.editBadge}>
                <MaterialCommunityIcons name="camera" size={16} color="#FFF" />
              </View>
            </TouchableOpacity>
          </View>
          <Text style={s.name}>{profile?.name || 'User'}</Text>
          <Text style={s.email}>{profile?.email || ''}</Text>
          <View style={s.rolePill}><Text style={s.roleText}>{role === 'mechanic' ? '🔧 Mechanic' : '🚗 Customer'}</Text></View>
        </LinearGradient>

        <View style={s.menuContainer}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} style={s.menuItem} onPress={item.onPress} activeOpacity={0.7}>
              <View style={s.menuIcon}><MaterialCommunityIcons name={item.icon} size={22} color={COLORS.textSecondary} /></View>
              <Text style={s.menuLabel}>{item.label}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.logoutSection}>
          <CustomButton title="Log Out" onPress={handleLogout} variant="danger" icon="logout" />
        </View>

        <Text style={s.version}>RoadRescue v1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="fade" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { maxHeight: '80%' }]}>
            <Text style={s.modalTitle}>Edit Profile</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={s.inputContainer}>
                <Text style={s.inputLabel}>Full Name</Text>
                <TextInput 
                  style={s.input} 
                  value={newName} 
                  onChangeText={setNewName} 
                  placeholder="Enter your name"
                />
              </View>

              <View style={s.inputContainer}>
                <Text style={s.inputLabel}>Phone Number</Text>
                <TextInput 
                  style={s.input} 
                  value={newPhone} 
                  onChangeText={setNewPhone} 
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              {role === 'customer' && (
                <>
                  <View style={s.inputContainer}>
                    <Text style={s.inputLabel}>Emergency SOS Contact</Text>
                    <TextInput 
                      style={s.input} 
                      value={newEmergencyContact} 
                      onChangeText={setNewEmergencyContact} 
                      placeholder="SOS emergency phone number"
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={s.inputContainer}>
                    <Text style={s.inputLabel}>Vehicle Info</Text>
                    <TextInput 
                      style={s.input} 
                      value={newVehicleInfo} 
                      onChangeText={setNewVehicleInfo} 
                      placeholder="e.g. Honda City i-VTEC (DL3C-BY-1234)"
                    />
                  </View>
                </>
              )}

              {role === 'mechanic' && (
                <View style={s.inputContainer}>
                  <Text style={s.inputLabel}>Service Specialty</Text>
                  <TextInput 
                    style={s.input} 
                    value={newSpecialty} 
                    onChangeText={setNewSpecialty} 
                    placeholder="e.g. flat_tire, battery, engine"
                  />
                </View>
              )}
            </ScrollView>

            <View style={s.modalActions}>
              <CustomButton title="Save Changes" onPress={handleUpdateProfile} loading={isUpdating} />
              <TouchableOpacity style={s.cancelBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Info Modal */}
      <Modal visible={infoModalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.infoIconContainer}>
              <MaterialCommunityIcons name={infoContent.icon} size={48} color={COLORS.primary} />
            </View>
            <Text style={s.modalTitle}>{infoContent.title}</Text>
            <Text style={s.infoBody}>{infoContent.body}</Text>
            <CustomButton title="Got it" onPress={() => setInfoModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 50, paddingBottom: SIZES.xxl, alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  backBtn: { position: 'absolute', top: 50, left: SIZES.screenPadding, width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  avatarContainer: { marginTop: SIZES.xl },
  avatarTouchable: { width: 88, height: 88, borderRadius: 44, position: 'relative', ...SHADOWS.medium },
  avatarImage: { width: 88, height: 88, borderRadius: 44, resizeMode: 'cover' },
  avatarPlaceholder: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 36, color: COLORS.primary, ...FONTS.bold },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  name: { fontSize: SIZES.h3, color: '#FFF', ...FONTS.bold, marginTop: SIZES.md },
  email: { fontSize: SIZES.bodySmall, color: 'rgba(255,255,255,0.8)', ...FONTS.regular, marginTop: 4 },
  rolePill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: SIZES.base, paddingVertical: SIZES.xs, borderRadius: SIZES.borderRadiusFull, marginTop: SIZES.md },
  roleText: { fontSize: SIZES.caption, color: '#FFF', ...FONTS.semiBold },
  menuContainer: { backgroundColor: COLORS.surface, marginHorizontal: SIZES.screenPadding, marginTop: -SIZES.base, borderRadius: SIZES.borderRadius, ...SHADOWS.medium },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SIZES.base, paddingHorizontal: SIZES.base, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: SIZES.body, color: COLORS.textPrimary, marginLeft: SIZES.md, ...FONTS.medium },
  logoutSection: { paddingHorizontal: SIZES.screenPadding, marginTop: SIZES.xl },
  version: { fontSize: SIZES.caption, color: COLORS.textTertiary, textAlign: 'center', marginTop: SIZES.xl, ...FONTS.regular },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: SIZES.lg },
  modalContent: { backgroundColor: COLORS.white, borderRadius: 24, padding: SIZES.xl, ...SHADOWS.large },
  modalTitle: { fontSize: SIZES.h3, color: COLORS.textPrimary, ...FONTS.bold, marginBottom: SIZES.xl, textAlign: 'center' },
  inputContainer: { marginBottom: SIZES.xl },
  inputLabel: { fontSize: SIZES.caption, color: COLORS.textSecondary, ...FONTS.semiBold, marginBottom: SIZES.xs },
  input: { backgroundColor: COLORS.background, borderRadius: 12, padding: SIZES.md, fontSize: SIZES.body, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.borderLight },
  modalActions: { gap: SIZES.sm },
  cancelBtn: { padding: SIZES.md, alignItems: 'center' },
  cancelText: { fontSize: SIZES.bodySmall, color: COLORS.textSecondary, ...FONTS.medium },
  infoIconContainer: { alignItems: 'center', marginBottom: SIZES.md },
  infoBody: { fontSize: SIZES.body, color: COLORS.textSecondary, ...FONTS.regular, textAlign: 'center', lineHeight: 24, marginBottom: SIZES.xl },
});

export default ProfileScreen;
