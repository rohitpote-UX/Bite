/**
 * Splash Screen — Animated TiffinFlow brand intro
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/constants/colors';
import { FontFamily, FontSize } from '../../src/constants/typography';
import { TIMING } from '../../src/constants/app';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const titleY = useSharedValue(30);
  const titleOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: titleY.value }],
    opacity: titleOpacity.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  useEffect(() => {
    // Sequence: logo → title → tagline → navigate
    logoScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    logoOpacity.value = withTiming(1, { duration: 600 });

    titleY.value = withDelay(400, withSpring(0, { damping: 12 }));
    titleOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));

    taglineOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));

    const timer = setTimeout(() => {
      router.replace('/(auth)/onboarding');
    }, TIMING.SPLASH_DURATION);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.secondary, '#CC3300']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Background decorative circles */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />

      {/* Logo */}
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>🍱</Text>
        </View>
      </Animated.View>

      {/* App Name */}
      <Animated.Text style={[styles.appName, titleStyle]}>TiffinFlow</Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, taglineStyle]}>
        Your office tiffin, simplified ✨
      </Animated.Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  circle1: {
    width: 300,
    height: 300,
    top: -80,
    right: -80,
  },
  circle2: {
    width: 200,
    height: 200,
    bottom: -40,
    left: -60,
  },
  logoContainer: {
    marginBottom: 8,
  },
  logoBox: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  logoEmoji: {
    fontSize: 52,
  },
  appName: {
    fontFamily: FontFamily.bold,
    fontSize: 40,
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  tagline: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
});
