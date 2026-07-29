import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MechanicDashboard from '../screens/mechanic/MechanicDashboard';
import ActiveJobScreen from '../screens/mechanic/ActiveJobScreen';
import JobDetailScreen from '../screens/mechanic/JobDetailScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import HistoryScreen from '../screens/shared/HistoryScreen';
import EarningsScreen from '../screens/mechanic/EarningsScreen';
import ServiceAreaScreen from '../screens/mechanic/ServiceAreaScreen';
import InventoryScreen from '../screens/mechanic/InventoryScreen';
import AlertsScreen from '../screens/mechanic/AlertsScreen';

const Stack = createStackNavigator();

const MechanicStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MechanicHome" component={MechanicDashboard} />
    <Stack.Screen name="ActiveJob" component={ActiveJobScreen} />
    <Stack.Screen name="JobDetail" component={JobDetailScreen} />
    <Stack.Screen name="Chat" component={ChatScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="History" component={HistoryScreen} />
    <Stack.Screen name="Earnings" component={EarningsScreen} />
    <Stack.Screen name="ServiceArea" component={ServiceAreaScreen} />
    <Stack.Screen name="Inventory" component={InventoryScreen} />
    <Stack.Screen name="Alerts" component={AlertsScreen} />
  </Stack.Navigator>
);

export default MechanicStack;
