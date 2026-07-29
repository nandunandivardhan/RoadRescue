import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import useUserStore from '../../store/useUserStore';

const LoginScreen = ({ navigation, route }) => {
  const selectedRole = route.params?.role || 'customer';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loginWithGoogle, isLoading, error, clearError } = useUserStore();

  // Native Google Sign-In Setup
  React.useEffect(() => {
    GoogleSignin.configure({
      webClientId: '370523129062-1gg1v2hldgjg8loh6kq980qqoe2ljsh9.apps.googleusercontent.com',
      offlineAccess: true,
    });
  }, []);

  const handleGoogleLogin = async () => {
    try {
      clearError();
      if (Platform.OS === 'web') {
        await loginWithGoogle(selectedRole);
      } else {
        console.log('Starting Native Google Sign-In...');
        await GoogleSignin.hasPlayServices();
        
        // FORCE account selection by signing out first
        try {
          await GoogleSignin.signOut();
        } catch (e) {}

        const response = await GoogleSignin.signIn();
        
        // Handle response based on version
        const idToken = response.data ? response.data.idToken : response.idToken;
        
        if (!idToken) {
          Alert.alert('Auth Error', 'No Google ID Token received. Please check Play Services.');
          return;
        }

        console.log(`Logging in as ${selectedRole}...`);
        await loginWithGoogle(selectedRole, { idToken });
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      let errorMsg = error.message || 'Unknown error';
      if (error.code === 'DEVELOPER_ERROR') {
        errorMsg = 'Developer Error: Check SHA-1/SHA-256 in Firebase Console.';
      }
      Alert.alert('Google Sign-In Failed', errorMsg);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    const result = await login(email, password);
    if (!result.success) {
      Alert.alert('Login Failed', result.error);
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
              <Text style={styles.roleText}>Login as {selectedRole.toUpperCase()}</Text>
            </View>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={200} style={styles.formContainer}>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.subWelcomeText}>Sign in to continue your journey</Text>

            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  placeholder="Email Address"
                  placeholderTextColor="#444"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#444"
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleEmailLogin}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialContainer}>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={handleGoogleLogin}
                disabled={isLoading}
              >
                <Ionicons name="logo-google" size={24} color="#EA4335" />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => navigation.navigate('PhoneLogin', { role: selectedRole })}
                disabled={isLoading}
              >
                <Ionicons name="call" size={24} color="#4CAF50" />
                <Text style={styles.socialButtonText}>Phone</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register', { role: selectedRole })}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
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
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subWelcomeText: {
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
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 56,
    marginBottom: 32,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    width: '48%',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  socialButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  footerText: {
    color: '#888',
    fontSize: 15,
  },
  registerLink: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
