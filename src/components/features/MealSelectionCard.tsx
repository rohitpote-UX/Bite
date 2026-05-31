/**
 * MealSelectionCard — The hero component for 1-tap meal confirmation
 * Shows Veg / Non-Veg / Skip buttons with animated selection feedback
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize, LineHeight } from '../../constants/typography';
import { BorderRadius, Shadow, Spacing } from '../../constants/spacing';
import { Badge } from '../ui/Badge';
import type { MealType, Meal } from '../../types';
import { formatDisplayDate } from '../../utils/calculations';
import { useTheme } from '../../context/ThemeContext';

interface MealSelectionCardProps {
  confirmedMeal: Meal | null;
  onConfirm: (mealType: MealType) => Promise<void>;
  cutoffPassed: boolean;
  timeUntilCutoff: string;
  vegPrice: number;
  nonVegPrice: number;
  isLoading?: boolean;
}

const MEAL_OPTIONS: Array<{
  type: MealType;
  emoji: string;
  label: string;
  sublabel: string;
  gradient: [string, string];
}> = [
  {
    type: 'veg',
    emoji: '🥦',
    label: 'Veg',
    sublabel: 'Fresh & healthy',
    gradient: ['#43A047', '#66BB6A'],
  },
  {
    type: 'non-veg',
    emoji: '🍗',
    label: 'Non Veg',
    sublabel: 'Protein rich',
    gradient: ['#8B1A1A', '#C62828'],
  },
  {
    type: 'skip',
    emoji: '⏭️',
    label: 'Skip',
    sublabel: "Not today",
    gradient: ['#757575', '#9E9E9E'],
  },
];

export const MealSelectionCard: React.FC<MealSelectionCardProps> = ({
  confirmedMeal,
  onConfirm,
  cutoffPassed,
  timeUntilCutoff,
  vegPrice,
  nonVegPrice,
  isLoading = false,
}) => {
  const { colors, isDark } = useTheme();
  const [selecting, setSelecting] = useState<MealType | null>(null);
  const confirmScale = useSharedValue(1);
  const successOpacity = useSharedValue(0);

  const confirmAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: confirmScale.value }],
    opacity: successOpacity.value,
  }));

  const handleSelect = async (mealType: MealType) => {
    if (isLoading || selecting) return;
    Vibration.vibrate(40);
    setSelecting(mealType);

    try {
      await onConfirm(mealType);
      // Success animation
      confirmScale.value = withSequence(
        withSpring(1.05, { damping: 8 }),
        withSpring(1, { damping: 12 })
      );
      successOpacity.value = withTiming(1, { duration: 300 });
    } catch (e) {
      console.error('Meal confirm error:', e);
    } finally {
      setSelecting(null);
    }
  };

  if (confirmedMeal) {
    return (
      <ConfirmedCard meal={confirmedMeal} colors={colors} isDark={isDark} />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }, Shadow.md]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.date, { color: colors.textTertiary }]}>
            {formatDisplayDate(new Date().toISOString().split('T')[0])}
          </Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            What's your meal today?
          </Text>
        </View>
        {!cutoffPassed && (
          <View style={styles.timerBadge}>
            <Text style={styles.timerEmoji}>⏰</Text>
            <Text style={styles.timerText}>{timeUntilCutoff}</Text>
          </View>
        )}
        {cutoffPassed && (
          <View style={[styles.timerBadge, styles.cutoffBadge]}>
            <Text style={styles.timerText}>Cutoff passed</Text>
          </View>
        )}
      </View>

      {/* Meal Option Buttons */}
      <View style={styles.options}>
        {MEAL_OPTIONS.map((option) => {
          const price = option.type === 'veg' ? vegPrice : option.type === 'non-veg' ? nonVegPrice : null;
          const isSelecting = selecting === option.type;

          return (
            <MealOptionButton
              key={option.type}
              option={option}
              price={price}
              isSelecting={isSelecting}
              disabled={cutoffPassed || (selecting !== null && !isSelecting)}
              onPress={() => handleSelect(option.type)}
            />
          );
        })}
      </View>

      <Text style={[styles.hint, { color: colors.textTertiary }]}>
        Your choice will be sent to the vendor automatically.
      </Text>
    </View>
  );
};

// ── Meal Option Button ─────────────────────────────────────────────────

interface MealOptionButtonProps {
  option: (typeof MEAL_OPTIONS)[0];
  price: number | null;
  isSelecting: boolean;
  disabled: boolean;
  onPress: () => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const MealOptionButton: React.FC<MealOptionButtonProps> = ({
  option,
  price,
  isSelecting,
  disabled,
  onPress,
}) => {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      style={[styles.optionButton, animStyle, disabled && styles.optionDisabled]}
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.94, { damping: 12 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
      disabled={disabled}
      activeOpacity={1}
    >
      <LinearGradient
        colors={disabled ? ['#CCCCCC', '#BBBBBB'] : option.gradient}
        style={styles.optionGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {isSelecting ? (
          <Text style={styles.optionEmoji}>⏳</Text>
        ) : (
          <Text style={styles.optionEmoji}>{option.emoji}</Text>
        )}
        <Text style={styles.optionLabel}>{option.label}</Text>
        {price !== null && (
          <Text style={styles.optionPrice}>₹{price}</Text>
        )}
      </LinearGradient>
    </AnimatedTouchable>
  );
};

// ── Confirmed Card ─────────────────────────────────────────────────────

const ConfirmedCard: React.FC<{ meal: Meal; colors: any; isDark: boolean }> = ({
  meal,
  colors,
  isDark,
}) => {
  const slideUp = useSharedValue(20);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    slideUp.value = withSpring(0, { damping: 12 });
    opacity.value = withTiming(1, { duration: 400 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideUp.value }],
    opacity: opacity.value,
  }));

  const mealColors = {
    veg: { bg: Colors.vegLight, text: Colors.vegDark, emoji: '🥦' },
    'non-veg': { bg: Colors.nonVegLight, text: Colors.nonVegDark, emoji: '🍗' },
    skip: { bg: Colors.skipLight, text: Colors.skip, emoji: '⏭️' },
  };
  const mc = mealColors[meal.mealType];

  return (
    <Animated.View
      style={[
        styles.confirmedContainer,
        { backgroundColor: mc.bg, borderColor: mc.text + '33' },
        animStyle,
        Shadow.sm,
      ]}
    >
      <Text style={styles.confirmedEmoji}>{mc.emoji}</Text>
      <View style={styles.confirmedContent}>
        <Text style={styles.confirmedCheck}>✅ Confirmed!</Text>
        <Text style={[styles.confirmedMeal, { color: mc.text }]}>
          {meal.mealType === 'veg' ? 'Vegetarian' : meal.mealType === 'non-veg' ? 'Non-Vegetarian' : 'Skipping today'}
        </Text>
        <Text style={[styles.confirmedDate, { color: Colors.textSecondary }]}>
          {formatDisplayDate(meal.date)}
          {meal.price > 0 && ` · ₹${meal.price}`}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  date: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
    marginBottom: 4,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.h3,
    lineHeight: LineHeight.h3,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.chip,
    gap: 4,
  },
  cutoffBadge: {
    backgroundColor: Colors.errorLight,
  },
  timerEmoji: { fontSize: 12 },
  timerText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.label,
    color: '#B45309',
  },
  options: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  optionButton: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionGradient: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    gap: 4,
  },
  optionEmoji: {
    fontSize: 32,
  },
  optionLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: '#FFFFFF',
  },
  optionPrice: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.caption,
    color: 'rgba(255,255,255,0.85)',
  },
  hint: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    textAlign: 'center',
  },
  confirmedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1.5,
  },
  confirmedEmoji: {
    fontSize: 48,
  },
  confirmedContent: {
    flex: 1,
    gap: 4,
  },
  confirmedCheck: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.body,
    color: Colors.veg,
  },
  confirmedMeal: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.h3,
  },
  confirmedDate: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
  },
});
