/**
 * SplashScreen — Web-Compatible version
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../utils/theme';

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.logoCircle}>
        <MaterialCommunityIcons name="car-wrench" size={60} color={COLORS.primary} />
      </View>

      <Text style={styles.title}>RoadRescue</Text>
      <Text style={styles.subtitle}>Vehicle Breakdown Assistance</Text>

      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.white} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.xl,
  },
  title: {
    fontSize: 42,
    color: COLORS.white,
    fontWeight: '800',
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
  },
  loadingContainer: {
    marginTop: 60,
  },
});

export default SplashScreen;
