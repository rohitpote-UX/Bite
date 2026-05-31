/**
 * Meals Screen — Full-screen meal picker with cutoff timer
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { Colors } from '../../src/constants/colors';
import { FontFamily, FontSize } from '../../src/constants/typography';
import { Spacing } from '../../src/constants/spacing';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useOffice } from '../../src/context/OfficeContext';
import { confirmMeal, listenToUserMeal } from '../../src/services/firebase/firestore.service';
import { isCutoffPassed, getTimeUntilCutoff, toDateString } from '../../src/utils/calculations';
import { MealSelectionCard } from '../../src/components/features/MealSelectionCard';
import { Card } from '../../src/components/ui/Card';
import type { Meal, MealType } from '../../src/types';

export default function MealsScreen() {
  const { userProfile } = useAuth();
  const { colors } = useTheme();
  const { vegPrice, nonVegPrice, cutoffTime } = useOffice();
  const [todayMeal, setTodayMeal] = useState<Meal | null>(null);

  const opacity = useSharedValue(0);
  const contentStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    if (!userProfile) return;
    const unsub = listenToUserMeal(userProfile.id, toDateString(new Date()), setTodayMeal);
    return unsub;
  }, [userProfile]);

  const handleMealConfirm = async (mealType: MealType) => {
    if (!userProfile) return;
    const price = mealType === 'veg' ? vegPrice : mealType === 'non-veg' ? nonVegPrice : 0;
    await confirmMeal(userProfile.id, userProfile.name, userProfile.officeId, mealType, price);
  };

  const cutoffPassed = isCutoffPassed(cutoffTime);
  const timeUntilCutoff = getTimeUntilCutoff(cutoffTime);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header */}
        <Text style={[styles.title, { color: colors.textPrimary }]}>Today's Tiffin</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Confirm your meal before {cutoffTime}
        </Text>

        {/* Main Meal Card */}
        <Animated.View style={contentStyle}>
          <MealSelectionCard
            confirmedMeal={todayMeal}
            onConfirm={handleMealConfirm}
            cutoffPassed={cutoffPassed}
            timeUntilCutoff={timeUntilCutoff}
            vegPrice={vegPrice}
            nonVegPrice={nonVegPrice}
          />
        </Animated.View>

        {/* Info Cards */}
        <Card style={styles.infoCard}>
          <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>📋 How it works</Text>
          <View style={styles.steps}>
            {[
              { step: '1', text: 'Choose your meal type before the cutoff time' },
              { step: '2', text: 'Your choice is shared with the vendor automatically' },
              { step: '3', text: 'Weekly bill is calculated and sent to you' },
            ].map((item) => (
              <View key={item.step} style={styles.step}>
                <View style={styles.stepDot}>
                  <Text style={styles.stepNum}>{item.step}</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.textSecondary }]}>{item.text}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Pricing Info */}
        <Card warm>
          <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>💰 Today's Pricing</Text>
          <View style={styles.priceRow}>
            <View style={styles.priceItem}>
              <Text style={styles.priceEmoji}>🥦</Text>
              <Text style={[styles.priceMeal, { color: colors.textPrimary }]}>Veg</Text>
              <Text style={[styles.priceAmt, { color: Colors.veg }]}>₹{vegPrice}</Text>
            </View>
            <View style={[styles.priceDivider, { backgroundColor: colors.border }]} />
            <View style={styles.priceItem}>
              <Text style={styles.priceEmoji}>🍗</Text>
              <Text style={[styles.priceMeal, { color: colors.textPrimary }]}>Non-Veg</Text>
              <Text style={[styles.priceAmt, { color: Colors.nonVeg }]}>₹{nonVegPrice}</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    padding: Spacing.screenHorizontal,
    gap: Spacing.md,
    paddingBottom: 40,
  },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.h1, marginBottom: 4 },
  subtitle: { fontFamily: FontFamily.regular, fontSize: FontSize.body, marginBottom: Spacing.sm },
  infoCard: {},
  infoTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.body, marginBottom: Spacing.md },
  steps: { gap: Spacing.sm },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNum: { fontFamily: FontFamily.bold, fontSize: FontSize.caption, color: '#FFF' },
  stepText: { fontFamily: FontFamily.regular, fontSize: FontSize.bodySm, flex: 1, lineHeight: 20 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  priceItem: { alignItems: 'center', gap: 4 },
  priceEmoji: { fontSize: 32 },
  priceMeal: { fontFamily: FontFamily.semiBold, fontSize: FontSize.body },
  priceAmt: { fontFamily: FontFamily.bold, fontSize: FontSize.h2 },
  priceDivider: { width: 1, height: 60, marginHorizontal: Spacing.lg },
});
