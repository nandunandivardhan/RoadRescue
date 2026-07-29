/**
 * CustomInput — Premium text input with floating label
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../utils/theme';

const CustomInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  rightIcon,
  onRightIconPress,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  multiline = false,
  numberOfLines = 1,
  error,
  style,
  inputStyle,
  editable = true,
  maxLength,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const animatedLabel = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedLabel, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelTop = animatedLabel.interpolate({
    inputRange: [0, 1],
    outputRange: [17, -8],
  });

  const labelFontSize = animatedLabel.interpolate({
    inputRange: [0, 1],
    outputRange: [SIZES.body, SIZES.caption],
  });

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          !editable && styles.inputDisabled,
          multiline && styles.multiline,
        ]}
      >
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={isFocused ? COLORS.primary : COLORS.textTertiary}
            style={styles.icon}
          />
        )}

        <View style={styles.inputWrapper}>
          {label && (
            <Animated.Text
              style={[
                styles.label,
                {
                  top: labelTop,
                  fontSize: labelFontSize,
                  color: isFocused ? COLORS.primary : COLORS.textTertiary,
                },
                error && { color: COLORS.danger },
              ]}
            >
              {label}
            </Animated.Text>
          )}
          <TextInput
            style={[
              styles.input,
              icon && { paddingLeft: 0 },
              multiline && { height: numberOfLines * 24, textAlignVertical: 'top' },
              inputStyle,
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={isFocused ? placeholder : ''}
            placeholderTextColor={COLORS.textTertiary}
            secureTextEntry={secureTextEntry && !isPasswordVisible}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            multiline={multiline}
            numberOfLines={numberOfLines}
            editable={editable}
            maxLength={maxLength}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </View>

        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightIcon}
          >
            <MaterialCommunityIcons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color={COLORS.textTertiary}
            />
          </TouchableOpacity>
        )}

        {rightIcon && !secureTextEntry && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIcon}
          >
            <MaterialCommunityIcons
              name={rightIcon}
              size={20}
              color={COLORS.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={14} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.base,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: SIZES.inputHeight,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SIZES.base,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  inputError: {
    borderColor: COLORS.danger,
    backgroundColor: '#FFF5F5',
  },
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: COLORS.borderLight,
  },
  multiline: {
    height: 'auto',
    minHeight: SIZES.inputHeight,
    paddingVertical: SIZES.md,
  },
  icon: {
    marginRight: SIZES.md,
  },
  inputWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    left: 0,
    backgroundColor: 'transparent',
    ...FONTS.medium,
    zIndex: 1,
  },
  input: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
    ...FONTS.regular,
    paddingTop: 8,
  },
  rightIcon: {
    marginLeft: SIZES.sm,
    padding: SIZES.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.xs,
    paddingLeft: SIZES.xs,
  },
  errorText: {
    fontSize: SIZES.caption,
    color: COLORS.danger,
    marginLeft: SIZES.xs,
    ...FONTS.regular,
  },
});

export default CustomInput;
