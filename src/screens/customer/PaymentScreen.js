import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CustomButton from '../../components/CustomButton';
import useRequestStore from '../../store/useRequestStore';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../utils/theme';
import { formatCurrency } from '../../utils/helpers';
import { createPaymentIntent, confirmPayment } from '../../services/paymentService';

const PaymentScreen = ({ navigation, route }) => {
  const { requestId, amount } = route.params;
  const { updateRequestStatus } = useRequestStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      const intent = await createPaymentIntent(amount);
      const result = await confirmPayment(intent.clientSecret);
      if (result.success) {
        await updateRequestStatus(requestId, 'completed', { paymentStatus: 'paid', finalCost: amount });
        setPaymentComplete(true);
      }
    } catch (e) {
      Alert.alert('Payment Failed', 'Please try again.');
    }
    setIsProcessing(false);
  };

  if (paymentComplete) {
    return (
      <View style={s.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={s.successContainer}>
          <View style={s.successIcon}><MaterialCommunityIcons name="check-circle" size={80} color={COLORS.success} /></View>
          <Text style={s.successTitle}>Payment Successful! 🎉</Text>
          <Text style={s.successSub}>Your payment of {formatCurrency(amount)} has been processed</Text>
          <CustomButton title="Back to Home" onPress={() => navigation.popToTop()} icon="home" style={{ marginTop: SIZES.xxl }} />
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={s.content}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>Payment</Text>

        <View style={s.amountCard}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={s.amountGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={s.amountLabel}>Total Amount</Text>
            <Text style={s.amountValue}>{formatCurrency(amount)}</Text>
            <Text style={s.amountSub}>Service charges included</Text>
          </LinearGradient>
        </View>

        <View style={s.methodCard}>
          <Text style={s.methodTitle}>Payment Method</Text>
          <TouchableOpacity style={s.methodOption}>
            <MaterialCommunityIcons name="credit-card" size={24} color={COLORS.primary} />
            <Text style={s.methodText}>Credit / Debit Card</Text>
            <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={s.methodOption}>
            <MaterialCommunityIcons name="wallet" size={24} color={COLORS.textTertiary} />
            <Text style={s.methodText}>UPI Payment</Text>
            <View />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }} />
        <CustomButton title={`Pay ${formatCurrency(amount)}`} onPress={handlePay} loading={isProcessing} icon="lock" iconPosition="left" />
        <Text style={s.secureText}>🔒 Secured by Stripe</Text>
        <View style={{ height: 30 }} />
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, paddingHorizontal: SIZES.screenPadding, paddingTop: 50 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', marginBottom: SIZES.lg },
  title: { fontSize: SIZES.h2, color: COLORS.textPrimary, ...FONTS.bold, marginBottom: SIZES.xl },
  amountCard: { borderRadius: SIZES.borderRadiusLg, overflow: 'hidden', marginBottom: SIZES.xl, ...SHADOWS.large },
  amountGradient: { padding: SIZES.xl, alignItems: 'center' },
  amountLabel: { fontSize: SIZES.bodySmall, color: 'rgba(255,255,255,0.8)', ...FONTS.regular },
  amountValue: { fontSize: 42, color: '#FFF', ...FONTS.extraBold, marginVertical: SIZES.sm },
  amountSub: { fontSize: SIZES.caption, color: 'rgba(255,255,255,0.7)', ...FONTS.regular },
  methodCard: { backgroundColor: COLORS.surface, borderRadius: SIZES.borderRadius, padding: SIZES.base, ...SHADOWS.small },
  methodTitle: { fontSize: SIZES.body, color: COLORS.textPrimary, ...FONTS.semiBold, marginBottom: SIZES.md },
  methodOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: SIZES.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  methodText: { flex: 1, fontSize: SIZES.bodySmall, color: COLORS.textPrimary, marginLeft: SIZES.md, ...FONTS.medium },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SIZES.xxl },
  successIcon: { marginBottom: SIZES.xl },
  successTitle: { fontSize: SIZES.h2, color: COLORS.textPrimary, ...FONTS.bold, textAlign: 'center' },
  successSub: { fontSize: SIZES.body, color: COLORS.textSecondary, ...FONTS.regular, textAlign: 'center', marginTop: SIZES.sm },
  secureText: { fontSize: SIZES.caption, color: COLORS.textTertiary, ...FONTS.regular, textAlign: 'center', marginTop: SIZES.md },
});

export default PaymentScreen;
