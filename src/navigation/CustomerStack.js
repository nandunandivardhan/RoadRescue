import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CustomerDashboard from '../screens/customer/CustomerDashboard';
import RequestHelpScreen from '../screens/customer/RequestHelpScreen';
import TrackMechanicScreen from '../screens/customer/TrackMechanicScreen';
import MyVehiclesScreen from '../screens/customer/MyVehiclesScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import PaymentScreen from '../screens/customer/PaymentScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import HistoryScreen from '../screens/shared/HistoryScreen';
import MembershipScreen from '../screens/customer/MembershipScreen';
import SupportScreen from '../screens/customer/SupportScreen';
import NearbyMechanicsScreen from '../screens/customer/NearbyMechanicsScreen';
import SOSScreen from '../screens/customer/SOSScreen';
import EmergencyContactsScreen from '../screens/customer/EmergencyContactsScreen';

const Stack = createStackNavigator();

const CustomerStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CustomerHome" component={CustomerDashboard} />
    <Stack.Screen name="RequestHelp" component={RequestHelpScreen} />
    <Stack.Screen name="NearbyMechanics" component={NearbyMechanicsScreen} />
    <Stack.Screen name="TrackMechanic" component={TrackMechanicScreen} />
    <Stack.Screen name="MyVehicles" component={MyVehiclesScreen} />
    <Stack.Screen name="Chat" component={ChatScreen} />
    <Stack.Screen name="Payment" component={PaymentScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="RequestHistory" component={HistoryScreen} />
    <Stack.Screen name="Membership" component={MembershipScreen} />
    <Stack.Screen name="Support" component={SupportScreen} />
    <Stack.Screen name="SOS" component={SOSScreen} />
    <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />
  </Stack.Navigator>
);

export default CustomerStack;
