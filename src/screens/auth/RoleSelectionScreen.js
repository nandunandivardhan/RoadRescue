import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

const RoleSelectionScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1a1a1a', '#000000']}
        style={styles.background}
      />

      <View style={styles.content}>
        <Animatable.View 
          animation="fadeInDown" 
          duration={1500} 
          style={styles.header}
        >
          <View style={styles.logoContainer}>
            <Ionicons name="car-sport" size={60} color="#FFD700" />
            <View style={styles.logoBadge}>
              <Ionicons name="flash" size={16} color="#000" />
            </View>
          </View>
          <Text style={styles.title}>RoadRescue</Text>
          <Text style={styles.subtitle}>Premium Roadside Assistance</Text>
        </Animatable.View>

        <Animatable.View 
          animation="fadeInUp" 
          delay={500} 
          duration={1000} 
          style={styles.selectionContainer}
        >
          <Text style={styles.selectionTitle}>Choose Your Role</Text>
          
          <TouchableOpacity 
            style={styles.roleCard}
            onPress={async () => {
              await AsyncStorage.setItem('pending_role', 'customer');
              navigation.navigate('Login', { role: 'customer' });
            }}
          >
            <LinearGradient
              colors={['#2c2c2c', '#1a1a1a']}
              style={styles.cardGradient}
            >
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 215, 0, 0.1)' }]}>
                <Ionicons name="person" size={32} color="#FFD700" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>Customer</Text>
                <Text style={styles.cardDesc}>I need roadside assistance or a mechanic.</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#555" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.roleCard}
            onPress={async () => {
              await AsyncStorage.setItem('pending_role', 'mechanic');
              navigation.navigate('Login', { role: 'mechanic' });
            }}
          >
            <LinearGradient
              colors={['#2c2c2c', '#1a1a1a']}
              style={styles.cardGradient}
            >
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                <Ionicons name="construct" size={32} color="#4CAF50" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>Mechanic</Text>
                <Text style={styles.cardDesc}>I want to provide repair services.</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#555" />
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>

        <Animatable.View 
          animation="fadeIn" 
          delay={1200} 
          style={styles.footer}
        >
          <Text style={styles.footerText}>Secure • Reliable • 24/7</Text>
        </Animatable.View>
      </View>
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
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  logoBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  selectionContainer: {
    width: '100%',
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  roleCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: '#888',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#444',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});

export default RoleSelectionScreen;
