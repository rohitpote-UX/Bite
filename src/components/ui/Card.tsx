/**
 * Card — TiffinFlow reusable card component
 * Warm rounded cards with optional press animation
 */

import React from 'react';
import { StyleSheet, ViewStyle, Pressable, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { BorderRadius, Shadow, Spacing } from '../../constants/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevated?: boolean;
  warm?: boolean;        // Use warm surface color
  noPadding?: boolean;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  elevated = false,
  warm = false,
  noPadding = false,
  testID,
}) => {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!onPress) {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: warm ? colors.surfaceWarm : colors.surface },
          elevated && Shadow.md,
          !elevated && Shadow.sm,
          noPadding && styles.noPadding,
          style,
        ]}
        testID={testID}
      >
        {children}
      </View>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.98, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      style={[
        styles.card,
        { backgroundColor: warm ? colors.surfaceWarm : colors.surface },
        elevated && Shadow.md,
        !elevated && Shadow.sm,
        noPadding && styles.noPadding,
        animatedStyle,
        style,
      ]}
      testID={testID}
    >
      {children}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    padding: Spacing.cardPadding,
    overflow: 'hidden',
  },
  noPadding: {
    padding: 0,
  },
});
