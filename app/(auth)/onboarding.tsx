/**
 * Onboarding Screen — 3-slide feature carousel
 */

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/constants/colors';
import { FontFamily, FontSize, LineHeight } from '../../src/constants/typography';
import { Spacing, BorderRadius } from '../../src/constants/spacing';
import { Button } from '../../src/components/ui/Button';
import { ONBOARDING_SLIDES } from '../../src/constants/app';
import { useTheme } from '../../src/context/ThemeContext';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { colors } = useTheme();

  const goNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex((i) => i + 1);
    } else {
      router.replace('/(auth)/login');
    }
  };

  const skip = () => router.replace('/(auth)/login');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipBtn} onPress={skip}>
        <Text style={[styles.skipText, { color: colors.textTertiary }]}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {/* Illustration Area */}
            <LinearGradient
              colors={[Colors.surfaceWarm, Colors.surface]}
              style={styles.illustrationBg}
            >
              <Text style={styles.slideEmoji}>{item.emoji}</Text>
            </LinearGradient>

            {/* Text */}
            <Text style={[styles.slideTitle, { color: colors.textPrimary }]}>
              {item.title}
            </Text>
            <Text style={[styles.slideSubtitle, { color: colors.textSecondary }]}>
              {item.subtitle}
            </Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {ONBOARDING_SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i === currentIndex ? Colors.primary : Colors.border,
                width: i === currentIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.cta}>
        <Button
          label={currentIndex === ONBOARDING_SLIDES.length - 1 ? 'Get Started 🍱' : 'Next →'}
          onPress={goNext}
          variant="primary"
          size="lg"
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: Spacing.screenHorizontal,
    zIndex: 10,
    padding: Spacing.sm,
  },
  skipText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
  },
  slide: {
    width,
    paddingTop: 100,
    paddingHorizontal: Spacing.screenHorizontal,
    alignItems: 'center',
    gap: Spacing.lg,
  },
  illustrationBg: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  slideEmoji: {
    fontSize: 100,
  },
  slideTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.h1,
    textAlign: 'center',
    lineHeight: LineHeight.h1,
  },
  slideSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyLg,
    textAlign: 'center',
    lineHeight: LineHeight.bodyLg,
    paddingHorizontal: Spacing.md,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingBottom: Spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  cta: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: 48,
  },
});
