import React, { useEffect, useState, Component } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import AuthStack from './src/navigation/AuthStack';
import CustomerStack from './src/navigation/CustomerStack';
import MechanicStack from './src/navigation/MechanicStack';
import AdminStack from './src/navigation/AdminStack';
import useUserStore from './src/store/useUserStore';
import { 
  registerForPushNotifications, 
  addNotificationListener, 
  addNotificationResponseListener 
} from './src/services/notification';
import useRequestStore from './src/store/useRequestStore';
import { COLORS, FONTS } from './src/utils/theme';

// Error Boundary for the entire app
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error('App Crash Error:', error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Oops! Something went wrong.</Text>
          <Text style={styles.errorText}>{this.state.error?.toString()}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => console.log('Reload requested')}><Text style={styles.retryText}>Return to App</Text></TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

// Premium Animated SplashScreen
const AnimatedSplash = () => (
  <View style={styles.splashContainer}>
    <LinearGradient colors={['#000', '#1a1a1a']} style={StyleSheet.absoluteFill} />
    <Animatable.View 
      animation="zoomIn" 
      duration={1500} 
      style={styles.logoCircle}
    >
      <Image 
        source={require('./assets/app_logo.png')} 
        style={{ width: 100, height: 100, borderRadius: 20 }}
        resizeMode="contain"
      />
    </Animatable.View>
    <Animatable.Text 
      animation="fadeInUp" 
      delay={800} 
      style={styles.splashTitle}
    >
      RoadRescue
    </Animatable.Text>
    <Animatable.Text 
      animation="fadeIn" 
      delay={1500} 
      style={styles.splashSub}
    >
      Premium Emergency Assistance
    </Animatable.Text>
    <View style={styles.splashFooter}>
      <ActivityIndicator color="#FF6B35" size="small" />
      <Text style={styles.loadingText}>Initializing secure connection...</Text>
    </View>
  </View>
);

export default function App() {
  const {
    user,
    isAuthenticated,
    isLoading,
    isProfileLoading,
    role,
    initAuthListener,
  } = useUserStore();
  
  const { fetchActiveRequest, activeRequest } = useRequestStore();

  const [ready, setReady] = useState(false);

  useEffect(() => {
    console.log('App: Bootstrap sequence started');
    
    // 1. Auth Listener
    const unsubscribe = initAuthListener();
    
    // 2. Notifications
    const setupNotifications = async () => {
      try {
        const token = await registerForPushNotifications();
        console.log('App: Push Token:', token);
        
        addNotificationListener(notification => {
          console.log('App: Notification Received:', notification);
        });

        addNotificationResponseListener(response => {
          console.log('App: Notification Response:', response);
        });
      } catch (e) {
        console.warn('App: Notification setup failed:', e);
      }
    };
    setupNotifications();

    // 3. Check for Active Request when user is authenticated
    if (isAuthenticated && user?.uid && role) {
      console.log('App: Authenticated. Checking for active request for role:', role);
      fetchActiveRequest(user.uid, role);
    }

    // 4. Minimum Splash Duration
    const timer = setTimeout(() => {
      setReady(true);
      console.log('App: Splash timer finished');
    }, 2500);

    return () => {
      if (unsubscribe) unsubscribe();
      clearTimeout(timer);
    };
  }, [isAuthenticated, user?.uid, role]);

  // Show splash during loading or forced timer
  if (!ready || isLoading || isProfileLoading) {
    return <AnimatedSplash />;
  }

  // Admin Check
  const isOwner = user?.email === 'nandunandivardhan7@gmail.com';

  const stack = () => {
    console.log('--- Navigation Debug ---');
    console.log('Auth State:', isAuthenticated ? 'Logged In' : 'Logged Out');
    console.log('User Role:', role);
    console.log('User Email:', user?.email);
    
    if (!isAuthenticated) {
      console.log('Showing: AuthStack');
      return <AuthStack />;
    }
    if (isOwner) {
      console.log('Showing: AdminStack');
      return <AdminStack />;
    }
    if (role === 'mechanic') {
      console.log('Showing: MechanicStack');
      return <MechanicStack />;
    }
    console.log('Showing: CustomerStack');
    return <CustomerStack />;
  };

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
        {stack()}
      </NavigationContainer>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  splashContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  logoCircle: { width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255, 107, 53, 0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255, 107, 53, 0.3)' },
  splashTitle: { color: '#FFF', fontSize: 42, fontWeight: 'bold', marginTop: 20, letterSpacing: 2 },
  splashSub: { color: '#888', fontSize: 14, marginTop: 5, letterSpacing: 1 },
  splashFooter: { position: 'absolute', bottom: 60, alignItems: 'center' },
  loadingText: { color: '#666', fontSize: 12, marginTop: 10 },
  errorContainer: { flex: 1, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', padding: 30 },
  errorTitle: { fontSize: 22, fontWeight: 'bold', color: '#FF1744', marginBottom: 10 },
  errorText: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 30 },
  retryBtn: { backgroundColor: '#FF6B35', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 10 },
  retryText: { color: '#FFF', fontWeight: 'bold' },
});
