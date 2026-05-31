/**
 * Button — TiffinFlow reusable button component
 * Variants: primary, secondary, ghost, danger, outline
 * Includes animated press feedback via Reanimated 3
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { BorderRadius, Spacing, Shadow } from '../../constants/spacing';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'veg' | 'non-veg';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
    opacity.value = withTiming(0.85, { duration: 80 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    opacity.value = withTiming(1, { duration: 80 });
  };

  const variantStyles = getVariantStyles(variant);
  const sizeStyles = getSizeStyles(size);

  return (
    <AnimatedTouchable
      style={[
        styles.base,
        variantStyles.container,
        sizeStyles.container,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        animatedStyle,
        style,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'ghost' || variant === 'outline' ? Colors.primary : Colors.textInverse}
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[styles.label, variantStyles.label, sizeStyles.label, textStyle]}>
            {label}
          </Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </AnimatedTouchable>
  );
};

function getVariantStyles(variant: ButtonVariant) {
  const variants: Record<ButtonVariant, { container: ViewStyle; label: TextStyle }> = {
    primary: {
      container: {
        backgroundColor: Colors.primary,
        ...Shadow.primary,
      },
      label: { color: Colors.textInverse },
    },
    secondary: {
      container: { backgroundColor: Colors.accent },
      label: { color: Colors.textPrimary },
    },
    ghost: {
      container: { backgroundColor: 'transparent' },
      label: { color: Colors.primary },
    },
    outline: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: Colors.primary,
      },
      label: { color: Colors.primary },
    },
    danger: {
      container: { backgroundColor: Colors.error },
      label: { color: Colors.textInverse },
    },
    veg: {
      container: { backgroundColor: Colors.veg, ...Shadow.sm },
      label: { color: Colors.textInverse },
    },
    'non-veg': {
      container: { backgroundColor: Colors.nonVeg, ...Shadow.sm },
      label: { color: Colors.textInverse },
    },
  };
  return variants[variant];
}

function getSizeStyles(size: ButtonSize) {
  const sizes: Record<ButtonSize, { container: ViewStyle; label: TextStyle }> = {
    sm: {
      container: { paddingVertical: Spacing.xs + 2, paddingHorizontal: Spacing.md },
      label: { fontSize: FontSize.bodySm },
    },
    md: {
      container: { paddingVertical: Spacing.sm + 4, paddingHorizontal: Spacing.lg },
      label: { fontSize: FontSize.body },
    },
    lg: {
      container: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
      label: { fontSize: FontSize.bodyLg },
    },
  };
  return sizes[size];
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: FontFamily.semiBold,
    letterSpacing: 0.2,
  },
  iconLeft: { marginRight: Spacing.xs },
  iconRight: { marginLeft: Spacing.xs },
});
