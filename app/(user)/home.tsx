/**
 * User Home Screen — Dashboard with meal confirmation, weekly summary, spending
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { FontFamily, FontSize, LineHeight } from '../../src/constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../src/constants/spacing';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useOffice } from '../../src/context/OfficeContext';
import { confirmMeal, listenToUserMeal, getUserMeals } from '../../src/services/firebase/firestore.service';
import {
  calculateWeeklySummary, calculateMonthlySummary,
  getGreeting, isCutoffPassed, getTimeUntilCutoff, toDateString,
  getWeekStart, getWeekEnd, getMonthStart, getMonthEnd,
} from '../../src/utils/calculations';
import { MealSelectionCard } from '../../src/components/features/MealSelectionCard';
import { WeeklySummaryCard } from '../../src/components/features/WeeklySummaryCard';
import { PaymentStatusBanner } from '../../src/components/features/FeatureComponents';
import { ActivityFeedItem } from '../../src/components/features/FeatureComponents';
import { Card } from '../../src/components/ui/Card';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import type { Meal, MealType, WeeklySummary } from '../../src/types';
import { formatAmount } from '../../src/utils/calculations';

export default function HomeScreen() {
  const { userProfile } = useAuth();
  const { colors } = useTheme();
  const { vegPrice, nonVegPrice, cutoffTime, officeName } = useOffice();

  const [todayMeal, setTodayMeal] = useState<Meal | null>(null);
  const [recentMeals, setRecentMeals] = useState<Meal[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmingMeal, setConfirmingMeal] = useState(false);

  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(-20);
  const contentOpacity = useSharedValue(0);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));

  const loadData = useCallback(async () => {
    if (!userProfile) return;
    try {
      const now = new Date();
      const start = toDateString(getWeekStart(now));
      const monthStart = toDateString(getMonthStart(now));
      const monthEnd = toDateString(getMonthEnd(now));

      const [weekMeals, monthMeals] = await Promise.all([
        getUserMeals(userProfile.id, start, toDateString(getWeekEnd(now))),
        getUserMeals(userProfile.id, monthStart, monthEnd),
      ]);

      const weekly = calculateWeeklySummary(weekMeals, vegPrice, nonVegPrice);
      const monthly = calculateMonthlySummary(monthMeals, vegPrice, nonVegPrice);

      setWeeklySummary(weekly);
      setMonthlyTotal(monthly.totalAmount);
      setRecentMeals(weekMeals.slice(0, 5));
    } catch (e) {
      console.error('Failed to load home data:', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [userProfile, vegPrice, nonVegPrice]);

  // Realtime today's meal
  useEffect(() => {
    if (!userProfile) return;
    const unsub = listenToUserMeal(userProfile.id, toDateString(new Date()), setTodayMeal);
    return unsub;
  }, [userProfile]);

  useEffect(() => {
    loadData();
    // Entrance animations
    headerOpacity.value = withTiming(1, { duration: 500 });
    headerY.value = withTiming(0, { duration: 500 });
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
  }, [loadData]);

  const handleMealConfirm = async (mealType: MealType) => {
    if (!userProfile) return;
    const price = mealType === 'veg' ? vegPrice : mealType === 'non-veg' ? nonVegPrice : 0;
    await confirmMeal(userProfile.id, userProfile.name, userProfile.officeId, mealType, price);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Loading your dashboard..." />;
  }

  const cutoffPassed = isCutoffPassed(cutoffTime);
  const timeUntilCutoff = getTimeUntilCutoff(cutoffTime);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* ── Animated Header ── */}
        <Animated.View style={[styles.header, headerStyle]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.textTertiary }]}>
              {getGreeting()}, 👋
            </Text>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>
              {userProfile?.name?.split(' ')[0] ?? 'Friend'}
            </Text>
            <Text style={[styles.officeName, { color: colors.textSecondary }]}>
              {officeName}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(user)/profile')}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.primary }]}>
              <Text style={styles.avatarText}>
                {(userProfile?.name ?? 'U')[0].toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.content, contentStyle]}>
          {/* ── Quick Stats Row ── */}
          <View style={styles.statsRow}>
            <StatCard
              label="This Week"
              value={formatAmount(weeklySummary?.totalAmount ?? 0)}
              emoji="📅"
              colors={colors}
            />
            <StatCard
              label="This Month"
              value={formatAmount(monthlyTotal)}
              emoji="📆"
              colors={colors}
            />
            <StatCard
              label="Pending"
              value="₹0"
              emoji="💳"
              colors={colors}
            />
          </View>

          {/* ── Meal Selection Card ── */}
          <MealSelectionCard
            confirmedMeal={todayMeal}
            onConfirm={handleMealConfirm}
            cutoffPassed={cutoffPassed}
            timeUntilCutoff={timeUntilCutoff}
            vegPrice={vegPrice}
            nonVegPrice={nonVegPrice}
          />

          {/* ── Payment Status ── */}
          <PaymentStatusBanner pendingAmount={0} onPay={() => router.push('/(user)/profile')} />

          {/* ── Weekly Summary ── */}
          {weeklySummary && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                This Week
              </Text>
              <WeeklySummaryCard summary={weeklySummary} />
            </View>
          )}

          {/* ── Recent Activity ── */}
          {recentMeals.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Recent Activity
                </Text>
                <TouchableOpacity onPress={() => router.push('/(user)/history')}>
                  <Text style={styles.viewAll}>View all →</Text>
                </TouchableOpacity>
              </View>
              <Card>
                {recentMeals.map((meal, i) => (
                  <ActivityFeedItem key={meal.id ?? i} meal={meal} />
                ))}
              </Card>
            </View>
          )}

          <View style={{ height: 32 }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Quick Stat Card ────────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string; value: string; emoji: string; colors: any;
}> = ({ label, value, emoji, colors }) => (
  <View style={[styles.statCard, { backgroundColor: colors.surface }, Shadow.sm]}>
    <Text style={styles.statEmoji}>{emoji}</Text>
    <Text style={[styles.statValue, { color: Colors.primary }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerLeft: { gap: 2 },
  greeting: { fontFamily: FontFamily.medium, fontSize: FontSize.body },
  userName: { fontFamily: FontFamily.bold, fontSize: FontSize.h1, letterSpacing: -0.5 },
  officeName: { fontFamily: FontFamily.regular, fontSize: FontSize.bodySm },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: FontFamily.bold, fontSize: FontSize.h3, color: '#FFF' },
  content: { paddingHorizontal: Spacing.screenHorizontal, gap: Spacing.md },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 4,
    gap: 4,
  },
  statEmoji: { fontSize: 20 },
  statValue: { fontFamily: FontFamily.bold, fontSize: FontSize.bodySm },
  statLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.label, textAlign: 'center' },
  section: { gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.h3 },
  viewAll: { fontFamily: FontFamily.semiBold, fontSize: FontSize.bodySm, color: Colors.primary },
});
