import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, StatusBar, Platform, Alert, Linking, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import * as SMS from 'expo-sms';
import * as Location from 'expo-location';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import useUserStore from '../../store/useUserStore';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../utils/theme';

const COUNTDOWN_TIME = 3; // seconds

const SOSScreen = ({ navigation, route }) => {
  const { location } = route.params || {};
  const { profile, emergencyContacts, fetchEmergencyContacts } = useUserStore();
  
  const [countdown, setCountdown] = useState(COUNTDOWN_TIME);
  const [isActive, setIsActive] = useState(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(true);
  const [emergencyId, setEmergencyId] = useState(null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const soundRef = useRef(null);
  const locationIntervalRef = useRef(null);

  // Load contacts if not loaded
  useEffect(() => {
    fetchEmergencyContacts();
  }, []);

  // 1. Countdown Logic
  useEffect(() => {
    let timer;
    if (countdown > 0 && !isActive) {
      timer = setTimeout(() => {
        setCountdown(c => c - 1);
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 1000);
    } else if (countdown === 0 && !isActive) {
      activateSOS();
    }
    return () => clearTimeout(timer);
  }, [countdown, isActive]);

  // 2. Alarm & Haptics loop when active
  useEffect(() => {
    if (isActive) {
      startAlarm();
      startLocationTracking();
      
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();

      // Haptic loop
      const hapticInterval = setInterval(() => {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }, 1000);

      return () => {
        clearInterval(hapticInterval);
        stopAlarm();
        if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
      };
    }
  }, [isActive]);

  const startAlarm = async () => {
    if (Platform.OS === 'web' || !isAlarmPlaying) return;
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://cdn.freesound.org/previews/198/198841_285997-lq.mp3' },
        { isLooping: true, shouldPlay: true }
      ).catch(err => {
        console.log('Alarm sound creation failed', err);
        return { sound: null };
      });
      
      if (sound) {
        soundRef.current = sound;
        await sound.playAsync().catch(() => {});
      }
    } catch (e) {
      console.log('Alarm system failure', e);
    }
  };

  const stopAlarm = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  };

  const toggleAlarm = () => {
    if (isAlarmPlaying) {
      stopAlarm();
      setIsAlarmPlaying(false);
    } else {
      setIsAlarmPlaying(true);
      startAlarm();
    }
  };

  // 3. Activation Protocol
  const activateSOS = async () => {
    setIsActive(true);
    
    // Create DB entry
    try {
      const eRef = await addDoc(collection(db, 'emergencies'), {
        userId: profile.uid,
        userName: profile.name,
        userPhone: profile.phoneNumber,
        vehicleInfo: profile.vehicleInfo || 'Unknown Vehicle',
        location: location || null,
        status: 'active',
        timestamp: serverTimestamp(),
      });
      setEmergencyId(eRef.id);
      console.log('Emergency created:', eRef.id);
    } catch (error) {
      console.error('Failed to create emergency record', error);
    }

    // Auto-Share Location
    shareLocation();
  };

  // 4. Continuous Tracking
  const startLocationTracking = () => {
    locationIntervalRef.current = setInterval(async () => {
      try {
        const currentLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const locData = { latitude: currentLoc.coords.latitude, longitude: currentLoc.coords.longitude };
        
        if (emergencyId) {
          await updateDoc(doc(db, 'emergencies', emergencyId), {
            location: locData,
            lastUpdated: serverTimestamp()
          });
        }
      } catch (error) {
        console.log('Tracking error:', error);
      }
    }, 10000); // 10 seconds
  };

  // 5. Sharing Logic
  const shareLocation = async () => {
    if (!location) return;
    const msg = `🚨 EMERGENCY! I need help. My live location: https://maps.google.com/?q=${location.latitude},${location.longitude} — Sent via RoadRescue`;
    
    if (emergencyContacts && emergencyContacts.length > 0) {
      const phones = emergencyContacts.map(c => c.phone);
      
      try {
        const isAvailable = await SMS.isAvailableAsync();
        if (isAvailable) {
          const { result } = await SMS.sendSMSAsync(phones, msg);
          if (result === 'sent') {
            Alert.alert('Success', `Location shared with ${phones.length} contacts.`);
          }
        } else {
          // Fallback to whatsapp if SMS unavailable
          shareWhatsApp(msg);
        }
      } catch (error) {
        console.log('SMS Error', error);
      }
    } else {
      Alert.alert('No Contacts', 'You have no emergency contacts saved. Please call 112 directly.');
    }
  };

  const shareWhatsApp = (msg) => {
    const encodedMsg = encodeURIComponent(msg || `🚨 EMERGENCY! I need help. My live location: https://maps.google.com/?q=${location?.latitude},${location?.longitude}`);
    Linking.openURL(`whatsapp://send?text=${encodedMsg}`).catch(() => {
      Alert.alert('Error', 'WhatsApp is not installed.');
    });
  };

  const handleCancel = async () => {
    if (emergencyId) {
      await updateDoc(doc(db, 'emergencies', emergencyId), {
        status: 'cancelled',
        endTime: serverTimestamp()
      });
    }
    stopAlarm();
    navigation.goBack();
  };

  // Render
  if (!isActive) {
    return (
      <View style={[s.container, { justifyContent: 'center', backgroundColor: '#D32F2F' }]}>
        <StatusBar barStyle="light-content" backgroundColor="#D32F2F" />
        <Animated.View style={[s.countdownCircle, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={s.countdownText}>{countdown}</Text>
        </Animated.View>
        <Text style={s.warningText}>SOS Activating in {countdown}s...</Text>
        
        <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={s.cancelBtnText}>CANCEL SOS</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: '#B71C1C' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#B71C1C" />
      <ScrollView contentContainerStyle={s.scroll}>
        
        {/* Header Alert */}
        <Animated.View style={[s.alertHeader, { transform: [{ scale: pulseAnim }] }]}>
          <MaterialCommunityIcons name="alert-decagram" size={60} color="#FFF" />
          <Text style={s.alertTitle}>SOS ACTIVE</Text>
          <Text style={s.alertSub}>Your location is being broadcasted</Text>
        </Animated.View>

        {/* Alarm Toggle */}
        <TouchableOpacity style={s.alarmToggle} onPress={toggleAlarm}>
          <MaterialCommunityIcons name={isAlarmPlaying ? "volume-high" : "volume-off"} size={24} color="#FFF" />
          <Text style={s.alarmText}>{isAlarmPlaying ? "Mute Alarm" : "Play Alarm"}</Text>
        </TouchableOpacity>

        {/* Share Options */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Share Location</Text>
          <View style={s.row}>
            <TouchableOpacity style={s.actionBtn} onPress={shareLocation}>
              <MaterialCommunityIcons name="message-alert" size={32} color="#D32F2F" />
              <Text style={s.actionText}>SMS Contacts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={() => shareWhatsApp()}>
              <MaterialCommunityIcons name="whatsapp" size={32} color="#25D366" />
              <Text style={s.actionText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Emergency Contacts calling options */}
        {emergencyContacts && emergencyContacts.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Emergency Contacts</Text>
            {emergencyContacts.map((contact, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={[s.callCard, { backgroundColor: 'rgba(255, 107, 53, 0.9)', marginBottom: 10 }]} 
                onPress={() => Linking.openURL(`tel:${contact.phone}`)}
              >
                <View style={[s.callIcon, { backgroundColor: '#E05A2B' }]}>
                  <MaterialCommunityIcons name="account-alert" size={28} color="#FFF" />
                </View>
                <View style={{ flex: 1, marginLeft: 15 }}>
                  <Text style={s.callTitle}>{contact.name}</Text>
                  <Text style={s.callSub}>Saved Emergency Contact</Text>
                </View>
                <MaterialCommunityIcons name="phone" size={24} color="#FFF" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Call Options */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Emergency Services</Text>
          
          <TouchableOpacity style={s.callCard} onPress={() => Linking.openURL('tel:112')}>
            <View style={s.callIcon}><MaterialCommunityIcons name="shield-star" size={28} color="#FFF" /></View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={s.callTitle}>Call 112</Text>
              <Text style={s.callSub}>National Emergency</Text>
            </View>
            <MaterialCommunityIcons name="phone" size={24} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity style={[s.callCard, { backgroundColor: 'rgba(25, 118, 210, 0.8)' }]} onPress={() => Linking.openURL('tel:100')}>
            <View style={[s.callIcon, { backgroundColor: '#1565C0' }]}><MaterialCommunityIcons name="police-badge" size={28} color="#FFF" /></View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={s.callTitle}>Call 100</Text>
              <Text style={s.callSub}>Police</Text>
            </View>
            <MaterialCommunityIcons name="phone" size={24} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity style={[s.callCard, { backgroundColor: 'rgba(56, 142, 60, 0.8)' }]} onPress={() => Linking.openURL('tel:108')}>
            <View style={[s.callIcon, { backgroundColor: '#2E7D32' }]}><MaterialCommunityIcons name="ambulance" size={28} color="#FFF" /></View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={s.callTitle}>Call 108</Text>
              <Text style={s.callSub}>Ambulance</Text>
            </View>
            <MaterialCommunityIcons name="phone" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Stop Button */}
        <TouchableOpacity style={s.stopBtn} onPress={handleCancel}>
          <MaterialCommunityIcons name="close-circle" size={24} color="#D32F2F" />
          <Text style={s.stopBtnText}>END EMERGENCY</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: SIZES.screenPadding, paddingTop: 60, paddingBottom: 40 },
  countdownCircle: { width: 150, height: 150, borderRadius: 75, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', ...SHADOWS.large },
  countdownText: { fontSize: 72, color: '#D32F2F', ...FONTS.bold },
  warningText: { fontSize: SIZES.h3, color: '#FFF', ...FONTS.semiBold, textAlign: 'center', marginTop: SIZES.xl },
  cancelBtn: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30, borderWidth: 2, borderColor: '#FFF' },
  cancelBtnText: { color: '#FFF', fontSize: SIZES.body, ...FONTS.bold },
  
  alertHeader: { alignItems: 'center', marginBottom: SIZES.xl },
  alertTitle: { fontSize: 32, color: '#FFF', ...FONTS.black, marginTop: 10, letterSpacing: 2 },
  alertSub: { fontSize: SIZES.bodySmall, color: 'rgba(255,255,255,0.8)', ...FONTS.medium, marginTop: 5 },
  
  alarmToggle: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginBottom: SIZES.xxl },
  alarmText: { color: '#FFF', marginLeft: 10, ...FONTS.bold },
  
  section: { marginBottom: SIZES.xxl },
  sectionTitle: { color: 'rgba(255,255,255,0.7)', fontSize: SIZES.caption, textTransform: 'uppercase', ...FONTS.bold, marginBottom: SIZES.md, letterSpacing: 1 },
  row: { flexDirection: 'row', gap: SIZES.md },
  actionBtn: { flex: 1, backgroundColor: '#FFF', borderRadius: SIZES.borderRadius, padding: SIZES.lg, alignItems: 'center', ...SHADOWS.medium },
  actionText: { marginTop: 10, color: COLORS.textPrimary, ...FONTS.semiBold, fontSize: SIZES.bodySmall },
  
  callCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(211, 47, 47, 0.8)', padding: SIZES.md, borderRadius: SIZES.borderRadius, marginBottom: SIZES.sm, ...SHADOWS.small },
  callIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#C62828', alignItems: 'center', justifyContent: 'center' },
  callTitle: { color: '#FFF', fontSize: SIZES.h4, ...FONTS.bold },
  callSub: { color: 'rgba(255,255,255,0.8)', fontSize: SIZES.caption, ...FONTS.medium },
  
  stopBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', padding: SIZES.lg, borderRadius: SIZES.borderRadius, marginTop: SIZES.xl, ...SHADOWS.large },
  stopBtnText: { color: '#D32F2F', fontSize: SIZES.body, ...FONTS.bold, marginLeft: 10 },
});

export default SOSScreen;
