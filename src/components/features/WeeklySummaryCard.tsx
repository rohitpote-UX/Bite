/**
 * WeeklySummaryCard — Shows this week's meal breakdown and spending
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { BorderRadius, Shadow, Spacing } from '../../constants/spacing';
import { formatAmount, formatWeekRange } from '../../utils/calculations';
import type { WeeklySummary } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface WeeklySummaryCardProps {
  summary: WeeklySummary;
  compact?: boolean;
}

export const WeeklySummaryCard: React.FC<WeeklySummaryCardProps> = ({ summary, compact = false }) => {
  const { colors, isDark } = useTheme();

  const stats = [
    { label: 'Veg Days', value: summary.vegDays, emoji: '🥦', color: Colors.veg },
    { label: 'Non-Veg', value: summary.nonVegDays, emoji: '🍗', color: Colors.nonVeg },
    { label: 'Skipped', value: summary.skippedDays, emoji: '⏭️', color: Colors.skip },
  ];

  if (compact) {
    return (
      <View style={[styles.compact, { backgroundColor: colors.surface }, Shadow.sm]}>
        <View style={styles.compactLeft}>
          <Text style={[styles.compactLabel, { color: colors.textSecondary }]}>This week</Text>
          <Text style={[styles.compactAmount, { color: colors.textPrimary }]}>
            {formatAmount(summary.totalAmount)}
          </Text>
        </View>
        <View style={styles.compactStats}>
          {stats.map((s) => (
            <View key={s.label} style={styles.compactStat}>
              <Text style={styles.compactStatEmoji}>{s.emoji}</Text>
              <Text style={[styles.compactStatValue, { color: s.color }]}>{s.value}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={isDark ? ['#2E1A0E', '#3D2518'] : ['#FFF3E8', '#FFEDE0']}
      style={[styles.container, Shadow.md]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Week Summary</Text>
          <Text style={[styles.weekRange, { color: colors.textSecondary }]}>
            {formatWeekRange(summary.weekStart, summary.weekEnd)}
          </Text>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{formatAmount(summary.totalAmount)}</Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {stats.map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: 'rgba(255,255,255,0.6)' }]}>
            <Text style={styles.statEmoji}>{s.emoji}</Text>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Progress bar for days accounted */}
      <View style={styles.progressSection}>
        <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
          Week progress
        </Text>
        <View style={[styles.progressBar, { backgroundColor: 'rgba(0,0,0,0.08)' }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(100, ((summary.vegDays + summary.nonVegDays + summary.skippedDays) / 5) * 100)}%`,
                backgroundColor: Colors.primary,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressCount, { color: colors.textTertiary }]}>
          {summary.vegDays + summary.nonVegDays + summary.skippedDays}/5 days recorded
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sectionLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
    marginBottom: 2,
  },
  weekRange: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodySm,
  },
  totalBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.label,
    color: 'rgba(255,255,255,0.8)',
  },
  totalAmount: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyLg,
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  statEmoji: { fontSize: 22 },
  statValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.h2,
  },
  statLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.label,
    textAlign: 'center',
  },
  progressSection: { gap: 6 },
  progressLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressCount: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.label,
  },
  // Compact variant
  compact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  compactLeft: { gap: 2 },
  compactLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
  },
  compactAmount: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.h3,
  },
  compactStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  compactStat: { alignItems: 'center', gap: 2 },
  compactStatEmoji: { fontSize: 18 },
  compactStatValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
  },
});
