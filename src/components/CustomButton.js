/**
 * CustomButton — Premium reusable button component
 */
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';

const CustomButton = ({
  title,
  onPress,
  variant = 'primary',    // primary | secondary | outline | ghost | danger
  size = 'large',          // large | medium | small
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = true,
}) => {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    disabled && styles.textDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.white}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <MaterialCommunityIcons
              name={icon}
              size={size === 'small' ? 16 : 20}
              color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.white}
              style={styles.iconLeft}
            />
          )}
          <Text style={textStyles}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <MaterialCommunityIcons
              name={icon}
              size={size === 'small' ? 16 : 20}
              color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.white}
              style={styles.iconRight}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: SIZES.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Variants
  primary: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.glow(COLORS.primary),
  },
  secondary: {
    backgroundColor: COLORS.secondary,
    ...SHADOWS.glow(COLORS.secondary),
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  ghost: {
    backgroundColor: COLORS.primaryGhost,
    shadowOpacity: 0,
    elevation: 0,
  },
  danger: {
    backgroundColor: COLORS.danger,
    ...SHADOWS.glow(COLORS.danger),
  },
  disabled: {
    opacity: 0.5,
  },
  // Sizes
  size_large: {
    height: SIZES.buttonHeight,
    paddingHorizontal: SIZES.xl,
  },
  size_medium: {
    height: 44,
    paddingHorizontal: SIZES.lg,
  },
  size_small: {
    height: 36,
    paddingHorizontal: SIZES.base,
    borderRadius: SIZES.borderRadiusSm,
  },
  // Text styles
  text: {
    ...FONTS.semiBold,
    letterSpacing: 0.3,
  },
  text_primary: {
    color: COLORS.white,
  },
  text_secondary: {
    color: COLORS.white,
  },
  text_outline: {
    color: COLORS.primary,
  },
  text_ghost: {
    color: COLORS.primary,
  },
  text_danger: {
    color: COLORS.white,
  },
  textSize_large: {
    fontSize: SIZES.body,
  },
  textSize_medium: {
    fontSize: SIZES.bodySmall,
  },
  textSize_small: {
    fontSize: SIZES.caption,
  },
  textDisabled: {
    opacity: 0.7,
  },
  iconLeft: {
    marginRight: SIZES.sm,
  },
  iconRight: {
    marginLeft: SIZES.sm,
  },
});

export default CustomButton;
