/**
 * Badge — Meal type, payment status, and general status badges
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { BorderRadius, Spacing } from '../../constants/spacing';
import type { MealType, PaymentStatus } from '../../types';

type BadgeType = MealType | PaymentStatus | 'pending-meal' | 'confirmed' | 'active' | 'inactive' | 'admin';

interface BadgeProps {
  type: BadgeType;
  label?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const BADGE_CONFIG: Record<BadgeType, { bg: string; text: string; label: string }> = {
  veg: { bg: Colors.vegLight, text: Colors.vegDark, label: '🥦 Veg' },
  'non-veg': { bg: Colors.nonVegLight, text: Colors.nonVegDark, label: '🍗 Non Veg' },
  skip: { bg: Colors.skipLight, text: Colors.skip, label: '⏭ Skip' },
  paid: { bg: Colors.successLight, text: Colors.vegDark, label: '✅ Paid' },
  pending: { bg: Colors.warningLight, text: '#B45309', label: '⏳ Pending' },
  overdue: { bg: Colors.errorLight, text: Colors.error, label: '⚠️ Overdue' },
  'pending-meal': { bg: '#FFF3E0', text: '#E65100', label: '⏰ Awaiting' },
  confirmed: { bg: Colors.successLight, text: Colors.vegDark, label: '✅ Confirmed' },
  active: { bg: Colors.successLight, text: Colors.vegDark, label: 'Active' },
  inactive: { bg: Colors.skipLight, text: Colors.skip, label: 'Inactive' },
  admin: { bg: '#EDE9FE', text: '#5B21B6', label: '👑 Admin' },
};

export const Badge: React.FC<BadgeProps> = ({ type, label, size = 'md', style }) => {
  const config = BADGE_CONFIG[type] ?? { bg: Colors.skipLight, text: Colors.skip, label: type };
  const displayLabel = label ?? config.label;

  return (
    <View style={[styles.base, size === 'sm' && styles.sm, { backgroundColor: config.bg }, style]}>
      <Text style={[styles.text, size === 'sm' && styles.textSm, { color: config.text }]}>
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xxs + 1,
    borderRadius: BorderRadius.badge,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: Spacing.xxs,
  },
  text: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.caption,
  },
  textSm: {
    fontSize: FontSize.label,
  },
});
