/**
 * PaymentStatusBanner — Shows pending dues with urgency styling
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { formatAmount } from '../../utils/calculations';

interface PaymentStatusBannerProps {
  pendingAmount: number;
  onPay?: () => void;
}

export const PaymentStatusBanner: React.FC<PaymentStatusBannerProps> = ({
  pendingAmount,
  onPay,
}) => {
  if (pendingAmount <= 0) {
    return (
      <View style={[styles.banner, styles.paidBanner]}>
        <Text style={styles.paidEmoji}>✅</Text>
        <Text style={[styles.text, styles.paidText]}>All payments up to date!</Text>
      </View>
    );
  }

  return (
    <View style={[styles.banner, styles.pendingBanner]}>
      <View style={styles.left}>
        <Text style={styles.pendingEmoji}>⚠️</Text>
        <View>
          <Text style={[styles.label, styles.pendingLabel]}>Payment Due</Text>
          <Text style={[styles.amount, styles.pendingAmount]}>{formatAmount(pendingAmount)}</Text>
        </View>
      </View>
      {onPay && (
        <TouchableOpacity style={styles.payButton} onPress={onPay}>
          <Text style={styles.payButtonText}>Pay Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * UserOrderCard — Single order item for admin orders list
 */

import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import type { Meal } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface UserOrderCardProps {
  meal: Meal;
  onPress?: () => void;
}

export const UserOrderCard: React.FC<UserOrderCardProps> = ({ meal, onPress }) => {
  const { colors } = useTheme();

  const timeStr = meal.confirmedAt
    ? new Date(meal.confirmedAt as any).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Auto';

  return (
    <TouchableOpacity
      style={[styles.orderCard, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Avatar name={meal.userName} size="md" />
      <View style={styles.orderInfo}>
        <Text style={[styles.orderName, { color: colors.textPrimary }]}>{meal.userName}</Text>
        <Text style={[styles.orderTime, { color: colors.textTertiary }]}>Confirmed at {timeStr}</Text>
      </View>
      <View style={styles.orderRight}>
        <Badge type={meal.mealType} size="sm" />
        {meal.price > 0 && (
          <Text style={[styles.orderPrice, { color: Colors.primary }]}>₹{meal.price}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

/**
 * ActivityFeedItem — Single activity row for home screen feed
 */

interface ActivityFeedItemProps {
  meal: Meal;
}

export const ActivityFeedItem: React.FC<ActivityFeedItemProps> = ({ meal }) => {
  const { colors } = useTheme();

  const emoji = meal.mealType === 'veg' ? '🥦' : meal.mealType === 'non-veg' ? '🍗' : '⏭️';
  const label = meal.mealType === 'veg' ? 'Vegetarian' : meal.mealType === 'non-veg' ? 'Non-Vegetarian' : 'Skipped';

  return (
    <View style={[styles.feedItem, { borderBottomColor: colors.divider }]}>
      <View style={[styles.feedDot, { backgroundColor: colors.surfaceWarm }]}>
        <Text style={styles.feedEmoji}>{emoji}</Text>
      </View>
      <View style={styles.feedContent}>
        <Text style={[styles.feedLabel, { color: colors.textPrimary }]}>{label}</Text>
        <Text style={[styles.feedDate, { color: colors.textTertiary }]}>
          {new Date(meal.date).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
          {meal.price > 0 ? ` · ₹${meal.price}` : ''}
        </Text>
      </View>
      {meal.isAutoDefaulted && (
        <Text style={styles.autoLabel}>Auto</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Payment Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  pendingBanner: { backgroundColor: Colors.warningLight },
  paidBanner: {
    backgroundColor: Colors.successLight,
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  pendingEmoji: { fontSize: 20 },
  paidEmoji: { fontSize: 18 },
  label: { fontFamily: FontFamily.medium, fontSize: FontSize.caption },
  pendingLabel: { color: '#B45309' },
  text: { fontFamily: FontFamily.semiBold, fontSize: FontSize.bodySm },
  paidText: { color: Colors.vegDark },
  amount: { fontFamily: FontFamily.bold, fontSize: FontSize.h3 },
  pendingAmount: { color: Colors.warning },
  payButton: {
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.sm,
  },
  payButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: '#FFFFFF',
  },

  // Order Card
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  orderInfo: { flex: 1 },
  orderName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.body },
  orderTime: { fontFamily: FontFamily.regular, fontSize: FontSize.caption, marginTop: 2 },
  orderRight: { alignItems: 'flex-end', gap: 4 },
  orderPrice: { fontFamily: FontFamily.bold, fontSize: FontSize.bodySm },

  // Activity Feed
  feedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 4,
    gap: Spacing.md,
    borderBottomWidth: 1,
  },
  feedDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedEmoji: { fontSize: 20 },
  feedContent: { flex: 1 },
  feedLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.body },
  feedDate: { fontFamily: FontFamily.regular, fontSize: FontSize.caption, marginTop: 2 },
  autoLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.label,
    color: Colors.textTertiary,
    backgroundColor: Colors.skipLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
