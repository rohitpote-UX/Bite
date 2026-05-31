/**
 * History Screen — Calendar view with color-coded meal days
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/colors';
import { FontFamily, FontSize } from '../../src/constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../src/constants/spacing';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useOffice } from '../../src/context/OfficeContext';
import { getUserMeals } from '../../src/services/firebase/firestore.service';
import { Badge } from '../../src/components/ui/Badge';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../src/components/ui/EmptyState';
import {
  toDateString, parseDate, getMonthStart, getMonthEnd,
  formatDisplayDate, formatAmount, formatMonth,
} from '../../src/utils/calculations';
import type { Meal } from '../../src/types';
import { MONTH_NAMES, DAY_NAMES } from '../../src/constants/app';

const MEAL_COLORS: Record<string, string> = {
  veg: Colors.veg,
  'non-veg': Colors.nonVeg,
  skip: Colors.skip,
};

export default function HistoryScreen() {
  const { userProfile } = useAuth();
  const { colors } = useTheme();
  const { vegPrice, nonVegPrice } = useOffice();

  const now = new Date();
  const [viewDate, setViewDate] = useState({ month: now.getMonth(), year: now.getFullYear() });
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const mealByDate = React.useMemo(() => {
    const map: Record<string, Meal> = {};
    meals.forEach((m) => { map[m.date] = m; });
    return map;
  }, [meals]);

  const loadMeals = useCallback(async () => {
    if (!userProfile) return;
    setIsLoading(true);
    const monthDate = new Date(viewDate.year, viewDate.month, 1);
    const start = toDateString(getMonthStart(monthDate));
    const end = toDateString(getMonthEnd(monthDate));
    const data = await getUserMeals(userProfile.id, start, end);
    setMeals(data);
    setIsLoading(false);
  }, [userProfile, viewDate]);

  useEffect(() => { loadMeals(); }, [loadMeals]);

  const goToPrevMonth = () => {
    setViewDate(({ month, year }) => {
      if (month === 0) return { month: 11, year: year - 1 };
      return { month: month - 1, year };
    });
  };

  const goToNextMonth = () => {
    setViewDate(({ month, year }) => {
      if (month === 11) return { month: 0, year: year + 1 };
      return { month: month + 1, year };
    });
  };

  // Build calendar grid
  const calendarDays = React.useMemo(() => {
    const firstDay = new Date(viewDate.year, viewDate.month, 1).getDay();
    const daysInMonth = new Date(viewDate.year, viewDate.month + 1, 0).getDate();
    const grid: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) grid.push(null);
    for (let d = 1; d <= daysInMonth; d++) grid.push(d);
    // Pad to complete last row
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
  }, [viewDate]);

  const selectedMeal = selectedDate ? mealByDate[selectedDate] : null;

  // Summary for this month
  const vegCount = meals.filter((m) => m.mealType === 'veg').length;
  const nonVegCount = meals.filter((m) => m.mealType === 'non-veg').length;
  const skipCount = meals.filter((m) => m.mealType === 'skip').length;
  const totalAmount = vegCount * vegPrice + nonVegCount * nonVegPrice;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Meal History</Text>
        </View>

        {/* Month Navigator */}
        <View style={[styles.monthNav, { backgroundColor: colors.surface }, Shadow.sm]}>
          <TouchableOpacity onPress={goToPrevMonth} style={styles.navBtn}>
            <Text style={[styles.navBtnText, { color: Colors.primary }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: colors.textPrimary }]}>
            {MONTH_NAMES[viewDate.month]} {viewDate.year}
          </Text>
          <TouchableOpacity
            onPress={goToNextMonth}
            style={styles.navBtn}
            disabled={viewDate.month === now.getMonth() && viewDate.year === now.getFullYear()}
          >
            <Text style={[styles.navBtnText, { color: Colors.primary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar */}
        <View style={[styles.calendar, { backgroundColor: colors.surface }, Shadow.sm]}>
          {/* Day headers */}
          <View style={styles.dayHeaders}>
            {DAY_NAMES.map((d) => (
              <Text key={d} style={[styles.dayHeader, { color: colors.textTertiary }]}>{d}</Text>
            ))}
          </View>

          {/* Day cells */}
          <View style={styles.daysGrid}>
            {calendarDays.map((day, i) => {
              if (!day) return <View key={`empty-${i}`} style={styles.dayCell} />;
              const dateStr = toDateString(new Date(viewDate.year, viewDate.month, day));
              const meal = mealByDate[dateStr];
              const isToday = dateStr === toDateString(new Date());
              const isSelected = dateStr === selectedDate;

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[
                    styles.dayCell,
                    isSelected && { backgroundColor: Colors.primary + '20' },
                  ]}
                  onPress={() => setSelectedDate(isSelected ? null : dateStr)}
                >
                  <View
                    style={[
                      styles.dayNum,
                      isToday && { backgroundColor: Colors.primary },
                      meal && { borderWidth: 2, borderColor: MEAL_COLORS[meal.mealType] },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: isToday ? '#FFF' : colors.textPrimary },
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                  {meal && (
                    <View style={[styles.mealDot, { backgroundColor: MEAL_COLORS[meal.mealType] }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {[
            { color: Colors.veg, label: 'Veg' },
            { color: Colors.nonVeg, label: 'Non-Veg' },
            { color: Colors.skip, label: 'Skip' },
          ].map((item) => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={[styles.legendText, { color: colors.textTertiary }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Selected Day Detail */}
        {selectedDate && (
          <View style={[styles.selectedDetail, { backgroundColor: colors.surface }, Shadow.sm]}>
            <Text style={[styles.selectedTitle, { color: colors.textPrimary }]}>
              {formatDisplayDate(selectedDate)}
            </Text>
            {selectedMeal ? (
              <View style={styles.selectedMealInfo}>
                <Badge type={selectedMeal.mealType} />
                {selectedMeal.price > 0 && (
                  <Text style={[styles.selectedPrice, { color: Colors.primary }]}>
                    {formatAmount(selectedMeal.price)}
                  </Text>
                )}
                {selectedMeal.isAutoDefaulted && (
                  <Text style={[styles.autoTag, { color: colors.textTertiary }]}>Auto-filled</Text>
                )}
              </View>
            ) : (
              <Text style={[styles.noMeal, { color: colors.textTertiary }]}>No meal recorded</Text>
            )}
          </View>
        )}

        {/* Monthly Summary */}
        <View style={[styles.summary, { backgroundColor: colors.surface }, Shadow.sm]}>
          <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>
            {MONTH_NAMES[viewDate.month]} Summary
          </Text>
          <View style={styles.summaryStats}>
            <SummaryStat emoji="🥦" label="Veg" value={vegCount} color={Colors.veg} />
            <SummaryStat emoji="🍗" label="Non-Veg" value={nonVegCount} color={Colors.nonVeg} />
            <SummaryStat emoji="⏭️" label="Skipped" value={skipCount} color={Colors.skip} />
          </View>
          <View style={[styles.summaryTotal, { borderTopColor: colors.divider }]}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Month Total</Text>
            <Text style={[styles.totalAmount, { color: Colors.primary }]}>{formatAmount(totalAmount)}</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const SummaryStat: React.FC<{ emoji: string; label: string; value: number; color: string }> = ({
  emoji, label, value, color,
}) => (
  <View style={styles.summaryStat}>
    <Text style={{ fontSize: 24 }}>{emoji}</Text>
    <Text style={[styles.summaryStatValue, { color }]}>{value}</Text>
    <Text style={[styles.summaryStatLabel]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    padding: Spacing.screenHorizontal,
    paddingBottom: Spacing.sm,
  },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.h1 },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.screenHorizontal,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  navBtn: { padding: Spacing.sm },
  navBtnText: { fontFamily: FontFamily.bold, fontSize: 24 },
  monthTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.h3 },
  calendar: {
    marginHorizontal: Spacing.screenHorizontal,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  dayHeaders: { flexDirection: 'row', marginBottom: Spacing.xs },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.caption,
  },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.xs,
    padding: 4,
  },
  dayNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: { fontFamily: FontFamily.medium, fontSize: FontSize.bodySm },
  mealDot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontFamily: FontFamily.medium, fontSize: FontSize.caption },
  selectedDetail: {
    marginHorizontal: Spacing.screenHorizontal,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  selectedTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.body },
  selectedMealInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  selectedPrice: { fontFamily: FontFamily.bold, fontSize: FontSize.body },
  autoTag: { fontFamily: FontFamily.regular, fontSize: FontSize.caption },
  noMeal: { fontFamily: FontFamily.regular, fontSize: FontSize.body },
  summary: {
    marginHorizontal: Spacing.screenHorizontal,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  summaryTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.h3 },
  summaryStats: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryStat: { alignItems: 'center', gap: 4 },
  summaryStatValue: { fontFamily: FontFamily.bold, fontSize: FontSize.h2 },
  summaryStatLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  totalLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.body },
  totalAmount: { fontFamily: FontFamily.bold, fontSize: FontSize.h2 },
});
