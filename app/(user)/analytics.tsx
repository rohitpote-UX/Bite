/**
 * Analytics Screen — Charts for spending trends and meal breakdown
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/colors';
import { FontFamily, FontSize } from '../../src/constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../src/constants/spacing';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useOffice } from '../../src/context/OfficeContext';
import { getUserMeals } from '../../src/services/firebase/firestore.service';
import { Card } from '../../src/components/ui/Card';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import {
  calculateWeeklySummary, getWeeklyAmountsForChart,
  toDateString, getWeekStart, getWeekEnd,
  getMonthStart, getMonthEnd, formatAmount,
} from '../../src/utils/calculations';
import type { Meal } from '../../src/types';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - Spacing.screenHorizontal * 2 - Spacing.cardPadding * 2;

export default function AnalyticsScreen() {
  const { userProfile } = useAuth();
  const { colors, isDark } = useTheme();
  const { vegPrice, nonVegPrice } = useOffice();

  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!userProfile) return;
    const now = new Date();
    // Load last 4 weeks of meals
    const fourWeeksAgo = new Date(now);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const data = await getUserMeals(
      userProfile.id,
      toDateString(fourWeeksAgo),
      toDateString(now)
    );
    setMeals(data);
    setIsLoading(false);
  }, [userProfile]);

  useEffect(() => { loadData(); }, [loadData]);

  if (isLoading) return <LoadingSpinner fullScreen label="Loading analytics..." />;

  // Compute analytics
  const vegCount = meals.filter((m) => m.mealType === 'veg').length;
  const nonVegCount = meals.filter((m) => m.mealType === 'non-veg').length;
  const skipCount = meals.filter((m) => m.mealType === 'skip').length;
  const total = vegCount + nonVegCount + skipCount || 1;
  const vegPct = Math.round((vegCount / total) * 100);
  const nonVegPct = Math.round((nonVegCount / total) * 100);

  const weeklyData = getWeeklyAmountsForChart(meals, vegPrice, nonVegPrice, 4);
  const maxAmount = Math.max(...weeklyData.map((w) => w.amount), 1);

  // Smart insight
  const insight = vegCount > nonVegCount
    ? `You prefer veg meals (${vegPct}% of the time). Great choice!`
    : nonVegCount > vegCount
    ? `You prefer non-veg meals (${nonVegPct}% of the time).`
    : 'You switch between veg and non-veg equally!';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Analytics</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Last 4 weeks</Text>
        </View>

        {/* Veg vs Non-Veg Donut */}
        <Card style={styles.chartCard} elevated>
          <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>🥗 Meal Preference</Text>
          <View style={styles.donutContainer}>
            {/* Simple segmented bar (no SVG needed) */}
            <View style={styles.donutRow}>
              <View style={[styles.donutSegment, {
                flex: vegPct,
                backgroundColor: Colors.veg,
                borderTopLeftRadius: 8,
                borderBottomLeftRadius: 8,
              }]} />
              <View style={[styles.donutSegment, {
                flex: nonVegPct,
                backgroundColor: Colors.nonVeg,
              }]} />
              <View style={[styles.donutSegment, {
                flex: 100 - vegPct - nonVegPct,
                backgroundColor: Colors.skip,
                borderTopRightRadius: 8,
                borderBottomRightRadius: 8,
              }]} />
            </View>
            <View style={styles.donutLegend}>
              <LegendItem color={Colors.veg} label="Veg" value={vegCount} pct={vegPct} />
              <LegendItem color={Colors.nonVeg} label="Non-Veg" value={nonVegCount} pct={nonVegPct} />
              <LegendItem color={Colors.skip} label="Skip" value={skipCount} pct={100 - vegPct - nonVegPct} />
            </View>
          </View>
        </Card>

        {/* Weekly Spending Bar Chart */}
        <Card style={styles.chartCard} elevated>
          <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>💰 Weekly Spending</Text>
          <View style={styles.barChart}>
            {weeklyData.map((week, i) => {
              const barHeight = maxAmount > 0 ? (week.amount / maxAmount) * 120 : 0;
              const weekLabel = `W${i + 1}`;
              return (
                <View key={week.week} style={styles.barGroup}>
                  <Text style={[styles.barAmount, { color: Colors.primary }]}>
                    {week.amount > 0 ? `₹${week.amount}` : '-'}
                  </Text>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(barHeight, 4),
                          backgroundColor: i === weeklyData.length - 1 ? Colors.primary : Colors.primary + '66',
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.textTertiary }]}>{weekLabel}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Smart Insight */}
        <Card warm style={styles.insightCard}>
          <Text style={styles.insightEmoji}>🧠</Text>
          <View>
            <Text style={[styles.insightTitle, { color: colors.textPrimary }]}>Smart Insight</Text>
            <Text style={[styles.insightText, { color: colors.textSecondary }]}>{insight}</Text>
          </View>
        </Card>

        {/* Summary Stats */}
        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>📊 Last 4 Weeks</Text>
          <View style={styles.summaryGrid}>
            <SummaryTile label="Total Meals" value={`${vegCount + nonVegCount}`} emoji="🍱" colors={colors} />
            <SummaryTile label="Veg Meals" value={`${vegCount}`} emoji="🥦" colors={colors} />
            <SummaryTile label="Non-Veg" value={`${nonVegCount}`} emoji="🍗" colors={colors} />
            <SummaryTile
              label="Total Spent"
              value={formatAmount(meals.reduce((s, m) => s + m.price, 0))}
              emoji="💰"
              colors={colors}
            />
          </View>
        </Card>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const LegendItem: React.FC<{ color: string; label: string; value: number; pct: number }> = ({
  color, label, value, pct,
}) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={styles.legendLabel}>{label}</Text>
    <Text style={[styles.legendPct, { color }]}>{pct}%</Text>
  </View>
);

const SummaryTile: React.FC<{ label: string; value: string; emoji: string; colors: any }> = ({
  label, value, emoji, colors,
}) => (
  <View style={[styles.summaryTile, { backgroundColor: colors.surfaceWarm }]}>
    <Text style={{ fontSize: 24 }}>{emoji}</Text>
    <Text style={[styles.tileValue, { color: Colors.primary }]}>{value}</Text>
    <Text style={[styles.tileLabel, { color: colors.textTertiary }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  header: { padding: Spacing.screenHorizontal, gap: 4 },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.h1 },
  subtitle: { fontFamily: FontFamily.regular, fontSize: FontSize.body },
  chartCard: { marginHorizontal: Spacing.screenHorizontal, marginBottom: Spacing.md },
  chartTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.body, marginBottom: Spacing.md },
  donutContainer: { gap: Spacing.md },
  donutRow: {
    flexDirection: 'row',
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  donutSegment: {},
  donutLegend: { flexDirection: 'row', justifyContent: 'space-around' },
  legendItem: { alignItems: 'center', gap: 4 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.caption, color: Colors.textSecondary },
  legendPct: { fontFamily: FontFamily.bold, fontSize: FontSize.body },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.md, height: 160 },
  barGroup: { flex: 1, alignItems: 'center', gap: 6 },
  barAmount: { fontFamily: FontFamily.semiBold, fontSize: FontSize.label, textAlign: 'center' },
  barWrapper: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', width: '100%' },
  bar: { width: '70%', borderRadius: 6 },
  barLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.caption },
  insightCard: { marginHorizontal: Spacing.screenHorizontal, marginBottom: Spacing.md, flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  insightEmoji: { fontSize: 32 },
  insightTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.body, marginBottom: 4 },
  insightText: { fontFamily: FontFamily.regular, fontSize: FontSize.bodySm, lineHeight: 20 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  summaryTile: {
    flex: 1,
    minWidth: '45%',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  tileValue: { fontFamily: FontFamily.bold, fontSize: FontSize.h3 },
  tileLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.caption, textAlign: 'center' },
});
