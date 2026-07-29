import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { auth } from '../../services/firebase';
import useUserStore from '../../store/useUserStore';

const PhoneLoginScreen = ({ navigation, route }) => {
  const selectedRole = route.params?.role || 'customer';
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [confirm, setConfirm] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(0);

  const { loginWithPhone } = useUserStore();

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number with country code (e.g. +91...)');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log('Sending OTP to:', phoneNumber);
      const confirmation = await auth.signInWithPhoneNumber(phoneNumber);
      setConfirm(confirmation);
      setStep('otp');
      setCountdown(30);
      console.log('OTP sent successfully');
    } catch (err) {
      console.error('Send OTP error:', err);
      let errorMsg = 'Failed to send OTP. Please ensure your number is correct.';
      
      if (err.code === 'auth/too-many-requests') {
        errorMsg = 'Too many attempts. Please try again later.';
      } else if (err.code === 'auth/invalid-phone-number') {
        errorMsg = 'Invalid phone number format. Use +[CountryCode][Number]';
      } else if (err.code === 'auth/captcha-check-failed') {
        errorMsg = 'App verification failed. Please try again.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMsg = 'Network error. Please check your connection.';
      }
      
      setError(errorMsg);
      Alert.alert('Phone Auth Error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit code sent to your phone.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log('Verifying OTP...');
      await confirm.confirm(otp);
      
      // After native confirm, our auth listener in useUserStore will pick it up,
      // but we might need to ensure the profile exists with the correct role.
      // For now, assume the user is authenticated and navigate.
      console.log('OTP Verified successfully');
    } catch (err) {
      console.error('Verify OTP error:', err);
      let errorMsg = 'Invalid OTP code. Please try again.';
      if (err.code === 'auth/session-expired') {
        errorMsg = 'Session expired. Please resend OTP.';
        setStep('phone');
      }
      setError(errorMsg);
      Alert.alert('Verification Failed', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#000', '#1a1a1a']}
        style={styles.background}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animatable.View animation="fadeIn" style={styles.header}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.roleIndicator}>
              <Text style={styles.roleText}>{selectedRole.toUpperCase()} AUTH</Text>
            </View>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={200} style={styles.formContainer}>
            <Text style={styles.title}>
              {step === 'phone' ? 'Phone Verification' : 'Enter OTP'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'phone' 
                ? 'We will send a code to verify your number' 
                : `Enter the 6-digit code sent to ${phoneNumber}`}
            </Text>

            <View style={styles.inputGroup}>
              {step === 'phone' ? (
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    placeholder="+91 9876543210"
                    placeholderTextColor="#444"
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                  />
                </View>
              ) : (
                <View style={styles.inputWrapper}>
                  <Ionicons name="key-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    placeholder="123456"
                    placeholderTextColor="#444"
                    style={styles.input}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    letterSpacing={8}
                  />
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={styles.mainButton}
              onPress={step === 'phone' ? handleSendOTP : handleVerifyOTP}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.buttonText}>
                    {step === 'phone' ? 'Send Code' : 'Verify & Login'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {step === 'otp' && (
              <TouchableOpacity 
                onPress={handleSendOTP} 
                disabled={countdown > 0 || isLoading}
                style={styles.resendContainer}
              >
                <Text style={[styles.resendText, countdown > 0 && { color: '#444' }]}>
                  {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            )}
          </Animatable.View>

          <View style={styles.footer}>
            <Ionicons name="shield-checkmark" size={16} color="#444" />
            <Text style={styles.secureText}>Secure, encrypted verification</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleIndicator: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  roleText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    color: '#fff',
    fontSize: 16,
  },
  mainButton: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 56,
    marginBottom: 20,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendContainer: {
    alignItems: 'center',
    padding: 10,
  },
  resendText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    gap: 8,
  },
  secureText: {
    color: '#444',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default PhoneLoginScreen;
